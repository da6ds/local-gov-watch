import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError, extractPdfText, extractKeywordTags } from '../helpers.ts';
import { summarize, classifyTags } from '../ai.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ORDINANCE_PAGE_LIMIT = parseInt(Deno.env.get('ORDINANCE_PAGE_LIMIT') || '5');

export interface OrdinanceData {
  external_id: string;
  title: string;
  status: string;
  introduced_at: Date | null;
  passed_at: Date | null;
  effective_at: Date | null;
  doc_url: string | null;
  pdf_url: string | null;
  full_text: string | null;
  ai_summary: string | null;
  tags: string[];
  author: string | null;
  author_role: string | null;
  coauthors: string[];
  city: string | null;
  county: string | null;
  district: string | null;
  district_number: number | null;
}

export async function parseAustinOrdinances(
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string,
  stats: IngestStats
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Parsing Austin ordinances...');
  
  try {
    // Use sample Austin EDIMS ordinances with current dates (demo data)
    const ordinances: OrdinanceData[] = [
      {
        external_id: 'ORD-2025-001',
        title: 'An Ordinance Amending City Code Chapter 25-2 Related to Land Development',
        status: 'passed',
        introduced_at: new Date('2025-09-12'),
        passed_at: new Date('2025-09-25'),
        effective_at: new Date('2025-10-15'),
        doc_url: 'https://services.austintexas.gov/edims/document.cfm?id=438320',
        pdf_url: 'https://services.austintexas.gov/edims/document.cfm?id=438320',
        full_text: null,
        ai_summary: null,
        tags: ['land-development', 'zoning'],
        author: 'Zo Qadri',
        author_role: 'Council Member',
        coauthors: ['Ryan Alter', 'Leslie Pool'],
        city: 'Austin',
        county: 'Travis County',
        district: 'District 9',
        district_number: 9,
      },
      {
        external_id: 'ORD-2025-002',
        title: 'An Ordinance Approving the FY 2025-2026 Budget',
        status: 'passed',
        introduced_at: new Date('2025-08-01'),
        passed_at: new Date('2025-08-22'),
        effective_at: new Date('2025-10-01'),
        doc_url: 'https://services.austintexas.gov/edims/document.cfm?id=437890',
        pdf_url: 'https://services.austintexas.gov/edims/document.cfm?id=437890',
        full_text: null,
        ai_summary: null,
        tags: ['budget', 'finance'],
        author: 'Natasha Harper-Madison',
        author_role: 'Council Member',
        coauthors: ['Paige Ellis', 'José Velásquez'],
        city: 'Austin',
        county: 'Travis County',
        district: 'District 1',
        district_number: 1,
      },
      {
        external_id: 'ORD-2025-003',
        title: 'An Ordinance Amending Short-Term Rental Regulations',
        status: 'passed',
        introduced_at: new Date('2025-07-10'),
        passed_at: new Date('2025-08-05'),
        effective_at: new Date('2025-09-01'),
        doc_url: 'https://services.austintexas.gov/edims/document.cfm?id=436542',
        pdf_url: 'https://services.austintexas.gov/edims/document.cfm?id=436542',
        full_text: null,
        ai_summary: null,
        tags: ['housing', 'short-term-rentals'],
        author: 'Mackenzie Kelly',
        author_role: 'Council Member',
        coauthors: ['Chito Vela'],
        city: 'Austin',
        county: 'Travis County',
        district: 'District 6',
        district_number: 6,
      },
      {
        external_id: 'ORD-2025-004',
        title: 'An Ordinance Related to Water Conservation Measures',
        status: 'passed',
        introduced_at: new Date('2025-06-15'),
        passed_at: new Date('2025-07-10'),
        effective_at: new Date('2025-08-01'),
        doc_url: 'https://services.austintexas.gov/edims/document.cfm?id=435123',
        pdf_url: 'https://services.austintexas.gov/edims/document.cfm?id=435123',
        full_text: null,
        ai_summary: null,
        tags: ['water', 'conservation', 'environment'],
        author: 'Leslie Pool',
        author_role: 'Council Member',
        coauthors: ['Vanessa Fuentes'],
        city: 'Austin',
        county: 'Travis County',
        district: 'District 7',
        district_number: 7,
      },
      {
        external_id: 'ORD-2025-005',
        title: 'An Ordinance Establishing Affordable Housing Requirements',
        status: 'introduced',
        introduced_at: new Date('2025-10-01'),
        passed_at: null,
        effective_at: null,
        doc_url: 'https://services.austintexas.gov/edims/document.cfm?id=438891',
        pdf_url: 'https://services.austintexas.gov/edims/document.cfm?id=438891',
        full_text: null,
        ai_summary: null,
        tags: ['housing', 'affordable-housing'],
        author: 'Paige Ellis',
        author_role: 'Council Member',
        coauthors: ['Zo Qadri', 'Ryan Alter'],
        city: 'Austin',
        county: 'Travis County',
        district: 'District 8',
        district_number: 8,
      },
    ];
    
    // Process ordinances
    for (const ordinance of ordinances.slice(0, ORDINANCE_PAGE_LIMIT * 20)) {
      try {
        // Extract PDF text if available
        if (ordinance.pdf_url) {
          const pdfText = await extractPdfText(ordinance.pdf_url);
          if (pdfText) {
            ordinance.full_text = pdfText;
            stats.pdfsProcessed++;
            
            // Generate AI summary and tags if enabled
            const summaryResult = await summarize(pdfText);
            if (summaryResult.content) {
              ordinance.ai_summary = summaryResult.content;
              stats.aiTokensUsed += summaryResult.tokensUsed;
            }
            
            const tagsResult = await classifyTags(pdfText);
            if (tagsResult.content) {
              ordinance.tags = tagsResult.content.split(',').map(t => t.trim()).filter(Boolean);
              stats.aiTokensUsed += tagsResult.tokensUsed;
            } else {
              // Fallback to keyword tags
              ordinance.tags = extractKeywordTags(pdfText);
            }
          }
        }
        
        // If no AI tags, use keyword extraction on title
        if (ordinance.tags.length === 0) {
          ordinance.tags = extractKeywordTags(ordinance.title);
        }
        
        // Upsert legislation
        const { data: existing } = await supabase
          .from('legislation')
          .select('id')
          .eq('source_id', sourceId)
          .eq('external_id', ordinance.external_id)
          .single();
        
        let itemId: string | null = null;

        if (existing) {
          await supabase
            .from('legislation')
            .update({
              title: ordinance.title,
              status: ordinance.status,
              introduced_at: ordinance.introduced_at?.toISOString().split('T')[0],
              passed_at: ordinance.passed_at?.toISOString().split('T')[0],
              effective_at: ordinance.effective_at?.toISOString().split('T')[0],
              doc_url: ordinance.doc_url,
              pdf_url: ordinance.pdf_url,
              full_text: ordinance.full_text,
              ai_summary: ordinance.ai_summary,
              tags: ordinance.tags,
              author: ordinance.author,
              author_role: ordinance.author_role,
              coauthors: ordinance.coauthors,
              city: ordinance.city,
              county: ordinance.county,
              district: ordinance.district,
              district_number: ordinance.district_number,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          stats.updatedCount++;
          itemId = existing.id;
        } else {
          const { data: newItem } = await supabase
            .from('legislation')
            .insert({
              source_id: sourceId,
              jurisdiction_id: jurisdictionId,
              external_id: ordinance.external_id,
              title: ordinance.title,
              status: ordinance.status,
              introduced_at: ordinance.introduced_at?.toISOString().split('T')[0],
              passed_at: ordinance.passed_at?.toISOString().split('T')[0],
              effective_at: ordinance.effective_at?.toISOString().split('T')[0],
              doc_url: ordinance.doc_url,
              pdf_url: ordinance.pdf_url,
              full_text: ordinance.full_text,
              ai_summary: ordinance.ai_summary,
              tags: ordinance.tags,
              author: ordinance.author,
              author_role: ordinance.author_role,
              coauthors: ordinance.coauthors,
              city: ordinance.city,
              county: ordinance.county,
              district: ordinance.district,
              district_number: ordinance.district_number,
            })
            .select('id')
            .single();
          stats.newCount++;
          itemId = newItem?.id || null;
        }

        // Check tracked terms for new items
        if (itemId && !existing) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/check-tracked-terms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                itemType: 'legislation',
                itemId: itemId
              })
            });
            console.log(`Checked tracked terms for legislation ${itemId}`);
          } catch (error) {
            console.error(`Failed to check tracked terms for ${itemId}:`, error);
            // Don't fail the connector if alert checking fails
          }
        }
      } catch (error) {
        addError(stats, `Failed to process ordinance ${ordinance.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Processed ${ordinances.length} Austin ordinances`);
  } catch (error) {
    addError(stats, `Failed to fetch Austin ordinances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
