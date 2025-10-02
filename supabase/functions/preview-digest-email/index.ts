import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { fetchDigestData, formatDate, formatDateTime } from '../_shared/digestHelpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, locations, topics, cadence } = await req.json();

    console.log('[preview-digest-email] Generating preview:', {
      locationsCount: locations?.length || 0,
      topicsCount: topics?.length || 0,
      cadence
    });

    // Validate inputs
    if (!name || !locations || locations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'VALIDATION_ERROR' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch digest data
    const data = await fetchDigestData(locations, topics);

    // Get location names for display
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: jurisdictions } = await supabase
      .from('jurisdiction')
      .select('name')
      .in('slug', locations);

    const locationNames = jurisdictions?.map((j) => j.name).join(', ') || locations.join(', ');

    // Generate HTML email
    const html = generateEmailHTML(name, locationNames, topics, cadence, data);

    console.log('[preview-digest-email] Preview generated successfully');

    return new Response(
      JSON.stringify({ html }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[preview-digest-email] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateEmailHTML(
  name: string,
  locationNames: string,
  topics: string[] | null,
  cadence: string,
  data: any
): string {
  const appUrl = Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '') || 'https://yourapp.com';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 15px; }
    .item { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #2563eb; }
    .item-title { font-weight: bold; color: #333; margin-bottom: 5px; }
    .item-meta { font-size: 14px; color: #666; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
    .badge-introduced { background: #3b82f6; color: white; }
    .badge-passed { background: #10b981; color: white; }
    .badge-pending { background: #f59e0b; color: white; }
    .empty-state { padding: 15px; text-align: center; color: #666; font-style: italic; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    a { color: #2563eb; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Local Gov Watch</h1>
      <p>Your ${cadence === 'daily' ? 'Daily' : cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} Digest</p>
    </div>
    
    <div class="content">
      <p>Hi ${name},</p>
      <p>Here's what's happening in local government related to your selected areas${topics && topics.length > 0 ? ' and topics' : ''}.</p>
      
      <div class="section">
        <div class="section-title">📋 Recent Legislation</div>
        ${
          data.legislation.length > 0
            ? data.legislation
                .map(
                  (item: any) => `
            <div class="item">
              <div class="item-title">${item.title}</div>
              ${item.status ? `<span class="badge badge-${getBadgeClass(item.status)}">${item.status}</span>` : ''}
              <div class="item-meta">${item.jurisdiction_name} | ${item.occurred_at ? formatDate(item.occurred_at) : 'Date TBD'}</div>
              ${item.ai_summary || item.summary ? `<p style="margin-top: 8px; font-size: 14px;">${item.ai_summary || item.summary}</p>` : ''}
              <a href="${appUrl}/legislation/${item.id}">View Details →</a>
            </div>
          `
                )
                .join('')
            : '<div class="empty-state">No recent legislation in selected areas</div>'
        }
      </div>
      
      <div class="section">
        <div class="section-title">📅 Upcoming Meetings</div>
        ${
          data.meetings.length > 0
            ? data.meetings
                .map(
                  (item: any) => `
            <div class="item">
              <div class="item-title">${item.body_name} - ${item.title}</div>
              <div class="item-meta">
                ${formatDateTime(item.starts_at)} ${item.location ? `| ${item.location}` : ''}
              </div>
              <div class="item-meta">${item.jurisdiction_name}</div>
              ${item.agenda_url ? `<a href="${item.agenda_url}">View Agenda →</a>` : ''}
              <a href="${appUrl}/meetings/${item.id}">Meeting Details →</a>
            </div>
          `
                )
                .join('')
            : '<div class="empty-state">No upcoming meetings scheduled</div>'
        }
      </div>
      
      ${
        data.trends.length > 0
          ? `
      <div class="section">
        <div class="section-title">📈 Trending Topics</div>
        ${data.trends
          .map(
            (trend: any) => `
          <div class="item">
            <div class="item-title">${trend.topic}</div>
            <div class="item-meta">${trend.count} items this week</div>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }
    </div>
    
    <div class="footer">
      <p>You're receiving this digest because you subscribed to updates for ${locationNames}.</p>
      ${topics && topics.length > 0 ? `<p>Filtered by topics: ${topics.join(', ')}</p>` : ''}
      <p><a href="${appUrl}/unsubscribe">Manage Subscription</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

function getBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('pass')) return 'passed';
  if (s.includes('intro')) return 'introduced';
  return 'pending';
}
