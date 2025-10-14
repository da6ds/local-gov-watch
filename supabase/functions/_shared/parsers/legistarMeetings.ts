import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError, extractPdfText } from '../helpers.ts';
import { summarize } from '../ai.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { determineMeetingType } from '../meetingTypeHelper.ts';

const MEETINGS_PAGE_LIMIT = parseInt(Deno.env.get('MEETINGS_PAGE_LIMIT') || '50');

export interface MeetingData {
  external_id: string;
  title: string;
  body_name: string;
  starts_at: Date;
  ends_at: Date | null;
  location: string | null;
  agenda_url: string | null;
  minutes_url: string | null;
  source_detail_url: string | null;
  attachments: any[];
  extracted_text: string | null;
  ai_summary: string | null;
}

function extractLegislationFromAgenda(text: string): any[] {
  // Simple placeholder - returns empty array for now
  return [];
}

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
  
  // Legistar calendar URL - fetches upcoming meetings
  const calendarUrl = `${baseUrl}/Calendar.aspx`;
  console.log(`📅 Fetching meetings from: ${calendarUrl}`);
  
  try {
    const response = await politeFetch(calendarUrl);
    const html = await response.text();
    const $ = await loadHTML(html);
    
    const meetings: MeetingData[] = [];
    
    // Parse upcoming meetings from calendar
    // Legistar uses a standard table format
    const rows: any[] = [];
    $('table.rgMasterTable tr, tr.rgRow, tr.rgAltRow').each((i: number, row: any) => {
      if (i === 0) return; // Skip header
      rows.push(row);
    });
    
    console.log(`Found ${rows.length} meeting rows to parse`);
    
    // Process rows asynchronously
    for (const row of rows.slice(0, MEETINGS_PAGE_LIMIT)) {
      try {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length < 3) continue;
        
        // Extract meeting info
        const bodyName = safeText(cells.eq(0).text()) || 'Board Meeting';
        const dateText = safeText(cells.eq(1).text());
        const timeText = safeText(cells.eq(2).text());
        const locationText = safeText(cells.eq(3).text());
        
        // Find agenda link
        const agendaLink = $row.find('a:contains("Agenda"), a[href*="agenda"]').first().attr('href') ||
                          $row.find('a[href*="AgendaQuick"]').first().attr('href');
        
        // Find meeting detail page link  
        const detailsLink = $row.find('a:contains("details"), a:contains("Details")').first().attr('href');
        const sourceDetailUrl = detailsLink ? new URL(detailsLink, baseUrl).href : null;
        
        // Try to find minutes link on calendar page
        const minutesLink = $row.find('a:contains("Minutes"), a[href*="minutes"]').first().attr('href');
        
        const starts_at = normalizeDate(`${dateText} ${timeText}`);
        if (!starts_at) {
          stats.skippedCount++;
          continue;
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
          source_detail_url: sourceDetailUrl,
          attachments: [],
          extracted_text: null,
          ai_summary: null,
        };
        
        meetings.push(meeting);
      } catch (error) {
        addError(stats, `Failed to parse meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Parsed ${meetings.length} meetings from Legistar`);
    
    // Process and upsert meetings
    for (const meeting of meetings) {
      try {
        const { data: existing } = await supabase
          .from('meeting')
          .select('id')
          .eq('source_id', sourceId)
          .eq('external_id', meeting.external_id)
          .maybeSingle();
        
        const { meetingType, isLegislative } = determineMeetingType(meeting.body_name);
        const now = new Date();
        const meetingStatus = !meeting.starts_at ? 'upcoming' : 
          meeting.starts_at > now ? 'upcoming' :
          meeting.starts_at > new Date(now.getTime() - 3 * 60 * 60 * 1000) ? 'in_progress' :
          'completed';

        const agendaStatus = meeting.agenda_url ? 'available' :
          meeting.starts_at && meeting.starts_at > new Date(now.getTime() + 72 * 60 * 60 * 1000) ? 'not_published' :
          'unavailable';

        const minutesStatus = meeting.minutes_url ? 'approved' :
          meetingStatus === 'completed' ? 'not_published' :
          'not_published';

        const meetingData = {
          title: meeting.title,
          body_name: meeting.body_name,
          meeting_type: meetingType,
          is_legislative: isLegislative,
          starts_at: meeting.starts_at.toISOString(),
          ends_at: meeting.ends_at?.toISOString(),
          location: meeting.location,
          agenda_url: meeting.agenda_url,
          agenda_status: agendaStatus,
          agenda_available_at: meeting.agenda_url && meeting.starts_at ? new Date(meeting.starts_at.getTime() - 72 * 60 * 60 * 1000).toISOString() : null,
          minutes_url: meeting.minutes_url,
          minutes_status: minutesStatus,
          minutes_available_at: meeting.minutes_url && meeting.starts_at ? new Date(meeting.starts_at.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
          source_detail_url: meeting.source_detail_url,
          status: meetingStatus,
          extracted_text: meeting.extracted_text,
          ai_summary: meeting.ai_summary,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase
            .from('meeting')
            .update(meetingData)
            .eq('id', existing.id);
          stats.updatedCount++;
        } else {
          const { data: newItem } = await supabase
            .from('meeting')
            .insert({
              source_id: sourceId,
              jurisdiction_id: jurisdictionId,
              external_id: meeting.external_id,
              ...meetingData
            })
            .select('id')
            .single();
          stats.newCount++;
          
          // Check tracked terms for new items
          if (newItem?.id) {
            try {
              await fetch(`${supabaseUrl}/functions/v1/check-tracked-terms`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                  itemType: 'meeting',
                  itemId: newItem.id
                })
              });
            } catch (error) {
              console.error(`Failed to check tracked terms for ${newItem.id}:`, error);
            }
          }
        }
      } catch (error) {
        addError(stats, `Failed to process meeting ${meeting.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`✅ Processed ${meetings.length} Legistar meetings`);
  } catch (error) {
    addError(stats, `Failed to fetch Legistar meetings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
