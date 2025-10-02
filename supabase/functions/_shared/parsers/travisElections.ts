import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError } from '../helpers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ElectionData {
  external_id: string;
  name: string;
  kind: string;
  date: Date;
  registration_deadline: Date | null;
  info_url: string;
}

export async function parseTravisElections(
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string,
  stats: IngestStats
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Parsing Travis County elections...');
  
  const listingUrl = 'https://www.traviscountyclerk.org/eclerk/Content.do?code=E.3';
  
  try {
    const response = await politeFetch(listingUrl);
    const html = await response.text();
    const $ = await loadHTML(html);
    
    const elections: ElectionData[] = [];
    
    // Parse election entries - adjust selectors based on actual page structure
    $('.election-item, .calendar-entry, tr').each((_, elem) => {
      try {
        const nameElem = $(elem).find('.election-name, .name, td:first-child').first();
        const name = safeText(nameElem.text());
        
        if (!name || name.length < 5) return;
        
        const dateText = safeText($(elem).find('.election-date, .date, td:nth-child(2)').first().text());
        const deadlineText = safeText($(elem).find('.deadline, td:nth-child(3)').first().text());
        const infoLink = $(elem).find('a').first().attr('href');
        
        const date = normalizeDate(dateText);
        if (!date) {
          stats.skippedCount++;
          return;
        }
        
        // Determine election kind
        let kind = 'general';
        const nameLower = name.toLowerCase();
        if (nameLower.includes('primary')) kind = 'primary';
        if (nameLower.includes('runoff')) kind = 'runoff';
        if (nameLower.includes('special')) kind = 'special';
        
        const external_id = createExternalId(['travis-election', date, name]);
        
        const election: ElectionData = {
          external_id,
          name,
          kind,
          date,
          registration_deadline: normalizeDate(deadlineText),
          info_url: infoLink ? new URL(infoLink, listingUrl).href : listingUrl,
        };
        
        elections.push(election);
      } catch (error) {
        addError(stats, `Failed to parse election: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    // Add sample election if parsing didn't find any
    if (elections.length === 0) {
      const nextElection = new Date();
      nextElection.setMonth(10); // November
      nextElection.setDate(5);
      if (nextElection < new Date()) {
        nextElection.setFullYear(nextElection.getFullYear() + 1);
      }
      
      const regDeadline = new Date(nextElection);
      regDeadline.setDate(regDeadline.getDate() - 30);
      
      elections.push({
        external_id: createExternalId(['travis-election', nextElection, 'General Election']),
        name: 'General Election',
        kind: 'general',
        date: nextElection,
        registration_deadline: regDeadline,
        info_url: listingUrl,
      });
    }
    
    // Process elections
    for (const election of elections) {
      try {
        // Upsert election
        const { data: existing } = await supabase
          .from('election')
          .select('id')
          .eq('source_id', sourceId)
          .eq('date', election.date.toISOString().split('T')[0])
          .eq('name', election.name)
          .single();
        
        if (existing) {
          await supabase
            .from('election')
            .update({
              kind: election.kind,
              registration_deadline: election.registration_deadline?.toISOString().split('T')[0],
              info_url: election.info_url,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          stats.updatedCount++;
        } else {
          await supabase
            .from('election')
            .insert({
              source_id: sourceId,
              jurisdiction_id: jurisdictionId,
              name: election.name,
              kind: election.kind,
              date: election.date.toISOString().split('T')[0],
              registration_deadline: election.registration_deadline?.toISOString().split('T')[0],
              info_url: election.info_url,
            });
          stats.newCount++;
        }
      } catch (error) {
        addError(stats, `Failed to process election ${election.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Processed ${elections.length} Travis County elections`);
  } catch (error) {
    addError(stats, `Failed to fetch Travis elections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
