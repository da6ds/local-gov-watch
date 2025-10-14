import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced minutes selectors - covers various Legistar formats
const minutesSelectors = [
  'a:contains("Minutes")',
  'a:contains("Draft Minutes")',
  'a:contains("Approved Minutes")',
  'a:contains("Meeting Minutes")',
  'a[href*="View.ashx?M=M"]',
  'a[href*="Minutes.pdf"]',
  'a[href*="minutes.pdf"]',
  'a[href*="/gateway.aspx"][href*=".pdf"]'
];

// Rate limiting helper
async function politeFetch(url: string, delayMs = 1000) {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return fetch(url, {
    headers: {
      'User-Agent': 'CivicTrackerBot/1.0 (Minutes Discovery)'
    }
  });
}

async function checkMeetingForMinutes(meeting: any) {
  if (!meeting.source_detail_url) {
    console.log(`No detail URL for meeting ${meeting.id} (${meeting.title})`);
    return null;
  }

  try {
    console.log(`Checking ${meeting.title} at ${meeting.source_detail_url}`);
    const response = await politeFetch(meeting.source_detail_url);
    
    if (!response.ok) {
      console.log(`Failed to fetch detail page: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try each selector
    let minutesLink = null;
    for (const selector of minutesSelectors) {
      const link = $(selector).first().attr('href');
      if (link && link.toLowerCase().includes('minute')) {
        minutesLink = link;
        console.log(`✅ Found minutes link: ${minutesLink}`);
        break;
      }
    }

    if (minutesLink) {
      // Make absolute URL
      const baseUrl = new URL(meeting.source_detail_url).origin;
      const absoluteUrl = new URL(minutesLink, baseUrl).href;
      
      // Determine status based on link text
      const linkText = $(`a[href*="${minutesLink}"]`).first().text().toLowerCase();
      const status = linkText.includes('draft') ? 'draft' : 'approved';
      
      return {
        minutes_url: absoluteUrl,
        minutes_status: status,
        minutes_available_at: new Date().toISOString()
      };
    }

    return null;
  } catch (err) {
    console.error(`Error checking meeting ${meeting.id}:`, err instanceof Error ? err.message : 'Unknown');
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting minutes discovery...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Query completed meetings without minutes
    // Only check meetings from 3 days to 60 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const { data: meetings, error } = await supabase
      .from('meeting')
      .select('id, title, body_name, source_detail_url, starts_at')
      .eq('status', 'completed')
      .is('minutes_url', null)
      .gte('starts_at', sixtyDaysAgo)
      .lte('starts_at', threeDaysAgo)
      .not('source_detail_url', 'is', null)
      .limit(50); // Process max 50 per run

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    console.log(`Found ${meetings?.length || 0} meetings to check`);

    const updates = [];
    let checked = 0;
    
    for (const meeting of meetings || []) {
      checked++;
      console.log(`[${checked}/${meetings?.length}] Checking: ${meeting.title}`);
      
      const minutesData = await checkMeetingForMinutes(meeting);
      
      if (minutesData) {
        console.log(`✅ Found minutes for: ${meeting.title}`);
        updates.push({ id: meeting.id, title: meeting.title, ...minutesData });
      } else {
        console.log(`ℹ️ No minutes yet for: ${meeting.title}`);
      }
    }

    // Update meetings that now have minutes
    if (updates.length > 0) {
      console.log(`\n📝 Updating ${updates.length} meetings with newly found minutes...`);
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('meeting')
          .update({
            minutes_url: update.minutes_url,
            minutes_status: update.minutes_status,
            minutes_available_at: update.minutes_available_at
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Failed to update meeting ${update.id}:`, updateError);
        } else {
          console.log(`✅ Updated: ${update.title}`);
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      checked: meetings?.length || 0,
      found: updates.length,
      updates: updates.map(u => ({ id: u.id, title: u.title, url: u.minutes_url }))
    };

    console.log('\n📊 Summary:');
    console.log(`   Checked: ${result.checked}`);
    console.log(`   Found: ${result.found}`);
    console.log('✅ Minutes discovery complete\n');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('❌ Minutes discovery error:', err);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
