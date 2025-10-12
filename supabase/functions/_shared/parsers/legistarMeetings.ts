import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError, extractPdfText, extractKeywordTags } from '../helpers.ts';
import { summarize } from '../ai.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractLegislationFromAgenda } from './agendaItemParser.ts';

const MEETINGS_PAGE_LIMIT = parseInt(Deno.env.get('MEETINGS_PAGE_LIMIT') || '5');

export interface MeetingData {
  external_id: string;
  title: string;
  body_name: string;
  starts_at: Date;
  ends_at: Date | null;
  location: string | null;
  agenda_url: string | null;
  minutes_url: string | null;
  attachments: any[];
  extracted_text: string | null;
  ai_summary: string | null;
}

/**
 * Generic Legistar meetings parser
 * Works for: Sonoma County, Napa County, Santa Rosa, Napa City
 */
export async function parseLegistarMeetings(
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string,
  baseUrl: string,
  stats: IngestStats
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log(`Parsing Legistar meetings from ${baseUrl}...`);
  
  // Legistar calendar URL
  const calendarUrl = `${baseUrl}/Calendar.aspx`;
  
  try {
    const response = await politeFetch(calendarUrl);
    const html = await response.text();
    const $ = await loadHTML(html);
    
    const meetings: MeetingData[] = [];
    
    // Parse upcoming meetings from calendar
    // Legistar uses a standard table format
    $('table.rgMasterTable tr, tr.rgRow, tr.rgAltRow').each((i, row) => {
      if (i === 0) return; // Skip header
      
      try {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length < 3) return;
        
        // Extract meeting info
        const bodyName = safeText(cells.eq(0).text()) || 'Board Meeting';
        const dateText = safeText(cells.eq(1).text());
        const timeText = safeText(cells.eq(2).text());
        const locationText = safeText(cells.eq(3).text());
        
        // Find agenda link
        const agendaLink = $row.find('a:contains("Agenda"), a[href*="agenda"]').first().attr('href') ||
                          $row.find('a[href*="AgendaQuick"]').first().attr('href');
        const minutesLink = $row.find('a:contains("Minutes"), a[href*="minutes"]').first().attr('href');
        
        const starts_at = normalizeDate(`${dateText} ${timeText}`);
        if (!starts_at) {
          stats.skippedCount++;
          return;
        }
        
        const external_id = createExternalId([baseUrl, bodyName, dateText]);
        
        const meeting: MeetingData = {
          external_id,
          title: bodyName,
          body_name: bodyName,
          starts_at,
          ends_at: null,
          location: locationText || null,
          agenda_url: agendaLink ? new URL(agendaLink, baseUrl).href : null,
          minutes_url: minutesLink ? new URL(minutesLink, baseUrl).href : null,
          attachments: [],
          extracted_text: null,
          ai_summary: null,
        };
        
        meetings.push(meeting);
      } catch (error) {
        addError(stats, `Failed to parse meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    console.log(`Found ${meetings.length} meetings from Legistar`);
    
    // Process meetings
    for (const meeting of meetings.slice(0, MEETINGS_PAGE_LIMIT)) {
      try {
        // Extract PDF text from agenda if available
        if (meeting.agenda_url && meeting.agenda_url.includes('.pdf')) {
          const pdfText = await extractPdfText(meeting.agenda_url);
          if (pdfText) {
            meeting.extracted_text = pdfText.substring(0, 50000); // Limit text size
            stats.pdfsProcessed++;
            
            // Generate AI summary if enabled
            const summaryResult = await summarize(pdfText.substring(0, 10000));
            if (summaryResult.content) {
              meeting.ai_summary = summaryResult.content;
              stats.aiTokensUsed += summaryResult.tokensUsed;
            }
          }
        }
        
        // Extract legislation from agenda text
        if (meeting.extracted_text) {
          const agendaLegislation = extractLegislationFromAgenda(meeting.extracted_text);
          
          if (agendaLegislation.length > 0) {
            console.log(`Found ${agendaLegislation.length} legislation items in agenda`);
            
            // Create legislation records for each extracted item
            for (const item of agendaLegislation) {
              try {
                const legExternalId = createExternalId([baseUrl, item.number, item.type]);
                
                const { data: existingLeg } = await supabase
                  .from('legislation')
                  .select('id')
                  .eq('external_id', legExternalId)
                  .eq('jurisdiction_id', jurisdictionId)
                  .maybeSingle();
                
                const legislationData = {
                  jurisdiction_id: jurisdictionId,
                  source_id: sourceId,
                  external_id: legExternalId,
                  title: item.title,
                  summary: `Discussed at ${meeting.title} on ${meeting.starts_at.toLocaleDateString()}`,
                  status: item.status,
                  introduced_at: meeting.starts_at.toISOString(),
                  doc_url: meeting.agenda_url, // Link to the agenda PDF
                  tags: extractKeywordTags(item.title),
                };
                
                if (existingLeg) {
                  await supabase
                    .from('legislation')
                    .update(legislationData)
                    .eq('id', existingLeg.id);
                  stats.updatedCount++;
                } else {
                  await supabase
                    .from('legislation')
                    .insert(legislationData);
                  stats.newCount++;
                }
              } catch (error) {
                console.error(`Failed to create legislation from agenda item:`, error);
              }
            }
          }
        }
        
        // Upsert meeting
        const { data: existing } = await supabase
          .from('meeting')
          .select('id')
          .eq('source_id', sourceId)
          .eq('external_id', meeting.external_id)
          .maybeSingle();
        
        let itemId: string | null = null;

        if (existing) {
          await supabase
            .from('meeting')
            .update({
              title: meeting.title,
              body_name: meeting.body_name,
              starts_at: meeting.starts_at.toISOString(),
              ends_at: meeting.ends_at?.toISOString(),
              location: meeting.location,
              agenda_url: meeting.agenda_url,
              minutes_url: meeting.minutes_url,
              extracted_text: meeting.extracted_text,
              ai_summary: meeting.ai_summary,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          stats.updatedCount++;
          itemId = existing.id;
        } else {
          const { data: newItem } = await supabase
            .from('meeting')
            .insert({
              source_id: sourceId,
              jurisdiction_id: jurisdictionId,
              external_id: meeting.external_id,
              title: meeting.title,
              body_name: meeting.body_name,
              starts_at: meeting.starts_at.toISOString(),
              ends_at: meeting.ends_at?.toISOString(),
              location: meeting.location,
              agenda_url: meeting.agenda_url,
              minutes_url: meeting.minutes_url,
              extracted_text: meeting.extracted_text,
              ai_summary: meeting.ai_summary,
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
                itemType: 'meeting',
                itemId: itemId
              })
            });
          } catch (error) {
            console.error(`Failed to check tracked terms for ${itemId}:`, error);
          }
        }
      } catch (error) {
        addError(stats, `Failed to process meeting ${meeting.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Processed ${meetings.length} Legistar meetings`);
  } catch (error) {
    addError(stats, `Failed to fetch Legistar meetings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}