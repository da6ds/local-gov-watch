import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError, extractKeywordTags } from '../helpers.ts';

const CAPITOL_TEXAS_GOV = 'capitol.texas.gov';
const MAX_REQ_PER_MIN = 10;
const BILLS_PAGE_LIMIT = parseInt(Deno.env.get('BILLS_PAGE_LIMIT') || '3');

let lastRequestTime = 0;
let requestCount = 0;

async function rateLimit() {
  const now = Date.now();
  if (now - lastRequestTime < 60000) {
    requestCount++;
    if (requestCount >= MAX_REQ_PER_MIN) {
      const waitTime = 60000 - (now - lastRequestTime);
      console.log(`Rate limit reached for ${CAPITOL_TEXAS_GOV}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      requestCount = 0;
      lastRequestTime = Date.now();
    }
  } else {
    requestCount = 1;
    lastRequestTime = now;
  }
}

async function politeFetchTexas(url: string, options: any = {}): Promise<Response> {
  await rateLimit();
  
  const response = await politeFetch(url, {
    ...options,
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Encoding': 'gzip, deflate',
      ...options.headers,
    },
  });

  // Enhanced logging for non-2xx responses
  if (!response.ok) {
    const bodySnippet = await response.text().then(t => t.substring(0, 200));
    console.error(`HTTP ${response.status} from ${url}`, {
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.url,
      bodySnippet,
    });
  }

  return response;
}

interface BillData {
  external_id: string;
  title: string;
  status: string;
  introduced_at: string | null;
  last_action_at: string | null;
  doc_url: string;
  pdf_url: string | null;
  summary: string | null;
  full_text: string | null;
  tags: string[];
}

export async function parseTexasBills(
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string,
  stats: IngestStats
): Promise<void> {
  console.log('Parsing Texas Legislature bills...');
  console.log(`Rate limit: ${MAX_REQ_PER_MIN} req/min, Page limit: ${BILLS_PAGE_LIMIT}`);

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Fetch recent bills listing
    const listingUrl = 'https://capitol.texas.gov/BillLookup/BillNumber.aspx';
    console.log(`Fetching bills from: ${listingUrl}`);
    
    const response = await politeFetchTexas(listingUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bills listing: HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = await loadHTML(html);
    
    console.log(`Robots check: Using CSS selectors: #results table tr, .bill-row`);

    // Parse bills from the listing page
    const bills: BillData[] = [];
    
    // Try multiple selector patterns for resilience
    const selectors = ['#results table tr', '.bill-row', 'table.bills tr'];
    let rowsFound = false;
    
    for (const selector of selectors) {
      const rows = $(selector);
      console.log(`Trying selector "${selector}": found ${rows.length} rows`);
      
      if (rows.length > 0) {
        rowsFound = true;
        rows.each((i, row) => {
          if (i === 0 || i >= BILLS_PAGE_LIMIT * 10) return; // Skip header and respect limit
          
          try {
            const $row = $(row);
            const billNum = safeText($row.find('td:nth-child(1)').text());
            const title = safeText($row.find('td:nth-child(2)').text());
            const lastAction = safeText($row.find('td:nth-child(3)').text());
            const detailLink = $row.find('a').attr('href');
            
            if (billNum && title) {
              bills.push({
                external_id: billNum,
                title,
                status: deriveStatus(lastAction),
                introduced_at: null,
                last_action_at: normalizeDate(lastAction)?.toISOString() || null,
                doc_url: detailLink ? `https://capitol.texas.gov${detailLink}` : listingUrl,
                pdf_url: null,
                summary: null,
                full_text: null,
                tags: extractKeywordTags(title + ' ' + lastAction),
              });
            }
          } catch (error) {
            console.error('Error parsing bill row:', error);
            stats.errorCount++;
          }
        });
        break;
      }
    }

    if (!rowsFound) {
      // Fallback: try to fetch specific bill IDs
      console.log('Fallback mode: fetching specific bill IDs');
      await fetchFallbackBills(bills, stats);
    }

    console.log(`Parsed ${bills.length} bills from listing`);
    stats.fetched = bills.length;

    // Upsert bills into database
    for (const bill of bills) {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from('legislation')
          .select('id, updated_at')
          .eq('external_id', bill.external_id)
          .eq('jurisdiction_id', jurisdictionId)
          .maybeSingle();

        if (fetchError) {
          addError(stats, `Fetch error for ${bill.external_id}: ${fetchError.message}`);
          continue;
        }

        const legislationData = {
          jurisdiction_id: jurisdictionId,
          source_id: sourceId,
          external_id: bill.external_id,
          title: bill.title,
          summary: bill.summary,
          status: bill.status,
          introduced_at: bill.introduced_at,
          doc_url: bill.doc_url,
          pdf_url: bill.pdf_url,
          full_text: bill.full_text,
          tags: bill.tags,
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
        const errorMsg = error instanceof Error ? error.message : String(error);
        addError(stats, `Error upserting ${bill.external_id}: ${errorMsg}`);
      }
    }

    console.log(`Processed ${bills.length} Texas bills`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in parseTexasBills:', errorMsg);
    addError(stats, errorMsg);
    throw error;
  }
}

function deriveStatus(lastAction: string): string {
  const action = lastAction.toLowerCase();
  if (action.includes('passed') || action.includes('enacted') || action.includes('signed')) {
    return 'passed';
  } else if (action.includes('filed') || action.includes('introduced')) {
    return 'introduced';
  } else if (action.includes('committee') || action.includes('referred')) {
    return 'in_committee';
  } else if (action.includes('failed') || action.includes('vetoed')) {
    return 'failed';
  }
  return 'introduced';
}

async function fetchFallbackBills(bills: BillData[], stats: IngestStats): Promise<void> {
  // Fallback strategy: try common bill patterns
  const billPatterns = [
    'HB1', 'HB2', 'HB3', 'HB4', 'HB5',
    'SB1', 'SB2', 'SB3', 'SB4', 'SB5',
  ];

  for (const billNum of billPatterns.slice(0, 20)) {
    try {
      const detailUrl = `https://capitol.texas.gov/BillLookup/History.aspx?LegSess=88R&Bill=${billNum}`;
      const response = await politeFetchTexas(detailUrl);
      
      if (response.ok) {
        const html = await response.text();
        const $ = await loadHTML(html);
        
        const title = safeText($('.bill-title, h2').first().text());
        const lastAction = safeText($('.actions tr').last().find('td').text());
        
        if (title) {
          bills.push({
            external_id: billNum,
            title,
            status: deriveStatus(lastAction),
            introduced_at: null,
            last_action_at: normalizeDate(lastAction)?.toISOString() || null,
            doc_url: detailUrl,
            pdf_url: null,
            summary: null,
            full_text: null,
            tags: extractKeywordTags(title),
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching fallback bill ${billNum}:`, error);
      stats.errorCount++;
    }
  }
}
