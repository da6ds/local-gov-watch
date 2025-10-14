import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MeetingData, IngestStats } from "../helpers.ts";
import { 
  normalizeDate, 
  createExternalId, 
  safeText,
  extractKeywordTags,
  politeFetch,
  addError,
  extractPdfText,
  summarize
} from "../helpers.ts";
import { determineMeetingType } from "../meetingTypeHelper.ts";

const MEETINGS_PAGE_LIMIT = 50;

function loadHTML(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc) throw new Error('Failed to parse HTML');
  // Simulate jQuery-like interface
  return (selector: string) => {
    const elements = doc.querySelectorAll(selector);
    return {
      each: (callback: (i: number, el: Element) => void) => {
        elements.forEach((el, i) => callback(i, el as Element));
      },
      first: () => elements[0] as Element | undefined,
      find: (subselector: string) => {
        const found = (elements[0] as Element)?.querySelectorAll(subselector) || [];
        return {
          first: () => found[0] as Element | undefined,
          attr: (attr: string) => (found[0] as Element)?.getAttribute(attr),
          text: () => (found[0] as Element)?.textContent?.trim() || '',
          eq: (index: number) => {
            const el = found[index] as Element;
            return {
              text: () => el?.textContent?.trim() || '',
              find: (s: string) => {
                const subels = el?.querySelectorAll(s) || [];
                return {
                  first: () => subels[0] as Element | undefined,
                  attr: (a: string) => (subels[0] as Element)?.getAttribute(a)
                };
              }
            };
          }
        };
      },
      text: () => (elements[0] as Element)?.textContent?.trim() || '',
      attr: (attr: string) => (elements[0] as Element)?.getAttribute(attr),
      eq: (index: number) => {
        const el = elements[index] as Element;
        return {
          text: () => el?.textContent?.trim() || ''
        };
      }
    };
  };
}

function extractLegislationFromAgenda(text: string): any[] {
  // Simple extraction logic - return empty for now
  return [];
}

async function upsertMeeting(
  supabase: SupabaseClient,
  meeting: MeetingData,
  jurisdictionId: string,
  sourceId: string
) {
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
  };

  if (existing) {
    await supabase
      .from('meeting')
      .update({ ...meetingData, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return existing.id;
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
    return newItem?.id || null;
  }
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
  
  const allMeetings: MeetingData[] = [];
  
  // Fetch month-by-month from January 2025 to 3 months in future
  const startDate = new Date('2025-01-01');
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead
  
  console.log(`📅 Fetching meetings from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
  
  const currentMonth = new Date(startDate);
  let monthCount = 0;
  
  // Loop through each month
  while (currentMonth <= endDate) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1; // JS months are 0-indexed
    
    // Legistar month view URL
    const monthUrl = `${baseUrl}/Calendar.aspx?View=Month&Year=${year}&Month=${month}`;
    console.log(`📆 Fetching ${year}-${month.toString().padStart(2, '0')}: ${monthUrl}`);
    
    try {
      const response = await politeFetch(monthUrl);
      const html = await response.text();
      const $ = loadHTML(html);
      
      const monthMeetings: MeetingData[] = [];
    
      // Parse meetings from calendar
      const rows: Element[] = [];
      $('table.rgMasterTable tr, tr.rgRow, tr.rgAltRow').each((i, row) => {
        if (i === 0) return; // Skip header
        rows.push(row);
      });
      
      // Process rows
      for (const row of rows) {
        try {
          const $row = (selector: string) => {
            const els = row.querySelectorAll(selector);
            return {
              find: (s: string) => {
                const found = row.querySelectorAll(s);
                return {
                  first: () => found[0] as Element | undefined,
                  attr: (a: string) => (found[0] as Element)?.getAttribute(a)
                };
              },
              eq: (index: number) => {
                const el = els[index] as Element;
                return {
                  text: () => el?.textContent?.trim() || ''
                };
              },
              length: els.length
            };
          };
          
          const cells = $row('td');
          
          if (cells.length < 3) continue;
          
          // Extract meeting info
          const bodyName = cells.eq(0).text() || 'Board Meeting';
          const dateText = cells.eq(1).text();
          const timeText = cells.eq(2).text();
          const locationText = cells.eq(3).text();
          
          // Find links
          const agendaLink = cells.find('a[href*="Agenda"], a[href*="AgendaQuick"]').first()?.attr('href');
          const detailsLink = cells.find('a:contains("details"), a:contains("Details")').first()?.attr('href');
          const minutesLink = cells.find('a:contains("Minutes"), a[href*="minutes"]').first()?.attr('href');
          
          const sourceDetailUrl = detailsLink ? new URL(detailsLink, baseUrl).href : null;
          
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
          
          monthMeetings.push(meeting);
          stats.foundCount++;
        } catch (err) {
          console.log(`⚠️ Error parsing row: ${err instanceof Error ? err.message : 'Unknown'}`);
          stats.errorCount++;
        }
      }
      
      console.log(`✅ Found ${monthMeetings.length} meetings for ${year}-${month.toString().padStart(2, '0')}`);
      allMeetings.push(...monthMeetings);
      
      monthCount++;
      
      // Rate limiting - wait 2 seconds between months
      if (currentMonth < endDate) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (err) {
      console.error(`❌ Error fetching ${year}-${month}: ${err instanceof Error ? err.message : 'Unknown'}`);
      stats.errorCount++;
    }
    
    // Move to next month
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  console.log(`\n📊 Total meetings found across ${monthCount} months: ${allMeetings.length}`);
  
  // Now process and upsert all meetings
  for (const meeting of allMeetings.slice(0, MEETINGS_PAGE_LIMIT)) {
    try {
      const itemId = await upsertMeeting(supabase, meeting, jurisdictionId, sourceId);
      stats.upsertedCount++;
      
      // Check tracked terms for new items
      if (itemId) {
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
    } catch (err) {
      console.error(`Error upserting meeting ${meeting.external_id}:`, err);
      stats.errorCount++;
    }
  }
  
  console.log(`✅ Processed ${Math.min(allMeetings.length, MEETINGS_PAGE_LIMIT)} Legistar meetings`);
}
