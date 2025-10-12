import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError, extractKeywordTags } from '../helpers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LEGISLATION_PAGE_LIMIT = parseInt(Deno.env.get('LEGISLATION_PAGE_LIMIT') || '10');

interface LegislationData {
  external_id: string;
  title: string;
  status: string;
  introduced_at: string | null;
  doc_url: string | null;
  summary: string | null;
  tags: string[];
  author: string | null;
}

/**
 * Generic Legistar legislation parser
 * Works for: Sonoma County, Napa County, Santa Rosa, Napa City
 */
export async function parseLegistarLegislation(
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string,
  baseUrl: string,
  stats: IngestStats
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log(`Parsing Legistar legislation from ${baseUrl}...`);
  
  // Legistar legislation URL
  const legislationUrl = `${baseUrl}/Legislation.aspx`;
  
  try {
    const response = await politeFetch(legislationUrl);
    const html = await response.text();
    const $ = await loadHTML(html);
    
    const legislation: LegislationData[] = [];
    
    // Parse legislation from table
    // Legistar uses a standard table format
    $('table.rgMasterTable tr.rgRow, table.rgMasterTable tr.rgAltRow').each((i, row) => {
      try {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length < 4) return;
        
        // Extract legislation info
        const fileNum = safeText(cells.eq(0).text());
        const type = safeText(cells.eq(1).text());
        const status = safeText(cells.eq(2).text());
        const fileCreated = safeText(cells.eq(3).text());
        const title = safeText(cells.eq(6).text()) || safeText(cells.eq(5).text());
        
        // Find detail link
        const detailLink = $row.find('a').first().attr('href');
        
        if (!fileNum || !title) return;
        
        const introduced_at = normalizeDate(fileCreated);
        const external_id = createExternalId([baseUrl, fileNum]);
        
        const item: LegislationData = {
          external_id,
          title,
          status: deriveStatus(status),
          introduced_at: introduced_at?.toISOString() || null,
          doc_url: detailLink ? new URL(detailLink, baseUrl).href : null,
          summary: null,
          tags: extractKeywordTags(`${type} ${title}`),
          author: null,
        };
        
        legislation.push(item);
      } catch (error) {
        addError(stats, `Failed to parse legislation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    console.log(`Found ${legislation.length} legislation items from Legistar`);
    
    // Process legislation
    for (const item of legislation.slice(0, LEGISLATION_PAGE_LIMIT)) {
      try {
        // Upsert legislation
        const { data: existing } = await supabase
          .from('legislation')
          .select('id')
          .eq('external_id', item.external_id)
          .eq('jurisdiction_id', jurisdictionId)
          .maybeSingle();

        const legislationData = {
          jurisdiction_id: jurisdictionId,
          source_id: sourceId,
          external_id: item.external_id,
          title: item.title,
          summary: item.summary,
          status: item.status,
          introduced_at: item.introduced_at,
          doc_url: item.doc_url,
          tags: item.tags,
          author: item.author,
        };

        if (existing) {
          await supabase
            .from('legislation')
            .update(legislationData)
            .eq('id', existing.id);
          stats.updatedCount++;
        } else {
          await supabase
            .from('legislation')
            .insert(legislationData);
          stats.newCount++;
        }
      } catch (error) {
        addError(stats, `Failed to process legislation ${item.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Processed ${legislation.length} Legistar legislation items`);
  } catch (error) {
    addError(stats, `Failed to fetch Legistar legislation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

function deriveStatus(statusText: string): string {
  if (!statusText) return 'introduced';
  
  const status = statusText.toLowerCase();
  if (status.includes('adopted') || status.includes('approved') || status.includes('passed')) {
    return 'passed';
  } else if (status.includes('final') || status.includes('effective')) {
    return 'effective';
  } else if (status.includes('pending') || status.includes('draft')) {
    return 'pending';
  } else if (status.includes('withdrawn') || status.includes('failed')) {
    return 'withdrawn';
  }
  return 'introduced';
}