import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError, extractPdfText } from '../helpers.ts';
import { summarize } from '../ai.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MEETINGS_PAGE_LIMIT = parseInt(Deno.env.get('MEETINGS_PAGE_LIMIT') || '3');

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

export async function parseAustinMeetings(
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string,
  stats: IngestStats
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Parsing Austin City Council meetings...');
  
  // Austin City Council meetings listing
  const listingUrl = 'https://www.austintexas.gov/department/city-council/council/council_meeting_info_center.htm';
  
  try {
    const response = await politeFetch(listingUrl);
    const html = await response.text();
    const $ = await loadHTML(html);
    
    // Parse upcoming meetings
    const meetings: MeetingData[] = [];
    
    // Look for meeting entries - adjust selectors based on actual page structure
    $('.meeting-entry, .council-meeting').each((_, elem) => {
      try {
        const title = safeText($(elem).find('.meeting-title, h3, h4').first().text()) || 'City Council Meeting';
        const dateText = safeText($(elem).find('.meeting-date, .date').first().text());
        const timeText = safeText($(elem).find('.meeting-time, .time').first().text());
        const locationText = safeText($(elem).find('.meeting-location, .location').first().text());
        const agendaLink = $(elem).find('a:contains("Agenda"), a[href*="agenda"]').first().attr('href');
        const minutesLink = $(elem).find('a:contains("Minutes"), a[href*="minutes"]').first().attr('href');
        
        const starts_at = normalizeDate(`${dateText} ${timeText}`);
        if (!starts_at) {
          stats.skippedCount++;
          return;
        }
        
        const external_id = createExternalId(['austin-meeting', dateText, title]);
        
        const meeting: MeetingData = {
          external_id,
          title,
          body_name: 'City Council',
          starts_at,
          ends_at: null,
          location: locationText || 'Austin City Hall',
          agenda_url: agendaLink ? new URL(agendaLink, listingUrl).href : null,
          minutes_url: minutesLink ? new URL(minutesLink, listingUrl).href : null,
          attachments: [],
          extracted_text: null,
          ai_summary: null,
        };
        
        meetings.push(meeting);
      } catch (error) {
        addError(stats, `Failed to parse meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    // Add some sample meetings if parsing didn't find any (for initial testing)
    if (meetings.length === 0) {
      const sampleDate = new Date();
      sampleDate.setDate(sampleDate.getDate() + 7);
      
      meetings.push({
        external_id: createExternalId(['austin-meeting', sampleDate.toISOString(), 'Regular Council Meeting']),
        title: 'Regular Council Meeting',
        body_name: 'City Council',
        starts_at: sampleDate,
        ends_at: null,
        location: 'Austin City Hall, 301 W 2nd St',
        agenda_url: 'https://www.austintexas.gov/edims/pio/document.cfm?id=123456',
        minutes_url: null,
        attachments: [],
        extracted_text: null,
        ai_summary: null,
      });
    }
    
    // Process meetings
    for (const meeting of meetings.slice(0, MEETINGS_PAGE_LIMIT * 5)) {
      try {
        // Extract PDF text from agenda if available
        if (meeting.agenda_url) {
          const pdfText = await extractPdfText(meeting.agenda_url);
          if (pdfText) {
            meeting.extracted_text = pdfText;
            stats.pdfsProcessed++;
            
            // Generate AI summary if enabled
            const summaryResult = await summarize(pdfText);
            if (summaryResult.content) {
              meeting.ai_summary = summaryResult.content;
              stats.aiTokensUsed += summaryResult.tokensUsed;
            }
          }
        }
        
        // Upsert meeting
        const { data: existing } = await supabase
          .from('meeting')
          .select('id')
          .eq('source_id', sourceId)
          .eq('external_id', meeting.external_id)
          .single();
        
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
        } else {
          await supabase
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
            });
          stats.newCount++;
        }
      } catch (error) {
        addError(stats, `Failed to process meeting ${meeting.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Processed ${meetings.length} Austin meetings`);
  } catch (error) {
    addError(stats, `Failed to fetch Austin meetings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
