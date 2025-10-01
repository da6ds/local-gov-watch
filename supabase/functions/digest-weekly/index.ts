import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DigestData {
  snapshot: {
    newLegislation: number;
    statusChanges: number;
    upcomingMeetings: number;
    upcomingElections: number;
  };
  trends: Array<{
    tag: string;
    label: string | null;
    itemCount: number;
    cities: string[];
    summary: string | null;
    itemIds: string[];
  }>;
  notableItems: Array<{
    type: string;
    title: string;
    date: string;
    url: string;
  }>;
}

async function buildDigestData(
  supabase: any,
  userId: string,
  scope: string,
  topics: string[],
  jurisdictionId: string
): Promise<DigestData> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
  
  const ninetyDaysOut = new Date();
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);
  
  // Get jurisdiction and children
  const { data: jurisdiction } = await supabase
    .from('jurisdiction')
    .select('id, type, parent_jurisdiction_id')
    .eq('id', jurisdictionId)
    .single();
  
  let jurisdictionIds = [jurisdictionId];
  
  if (scope === 'county' || scope === 'both') {
    const countyId = jurisdiction.type === 'county' 
      ? jurisdictionId 
      : jurisdiction.parent_jurisdiction_id;
    
    if (countyId) {
      const { data: cities } = await supabase
        .from('jurisdiction')
        .select('id')
        .eq('parent_jurisdiction_id', countyId);
      
      jurisdictionIds = [countyId, ...(cities || []).map((c: any) => c.id)];
    }
  }
  
  // Snapshot metrics
  const { count: newLegislation } = await supabase
    .from('legislation')
    .select('id', { count: 'exact', head: true })
    .in('jurisdiction_id', jurisdictionIds)
    .gte('created_at', weekAgo.toISOString());
  
  const { count: statusChanges } = await supabase
    .from('legislation')
    .select('id', { count: 'exact', head: true })
    .in('jurisdiction_id', jurisdictionIds)
    .gte('updated_at', weekAgo.toISOString())
    .neq('status', null);
  
  const { count: upcomingMeetings } = await supabase
    .from('meeting')
    .select('id', { count: 'exact', head: true })
    .in('jurisdiction_id', jurisdictionIds)
    .gte('starts_at', new Date().toISOString())
    .lte('starts_at', twoWeeksOut.toISOString());
  
  const { count: upcomingElections } = await supabase
    .from('election')
    .select('id', { count: 'exact', head: true })
    .in('jurisdiction_id', jurisdictionIds)
    .gte('date', new Date().toISOString().split('T')[0])
    .lte('date', ninetyDaysOut.toISOString().split('T')[0]);
  
  // Get trends
  const weekStart = new Date();
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  
  const countyId = jurisdiction.type === 'county' 
    ? jurisdictionId 
    : jurisdiction.parent_jurisdiction_id;
  
  let trendsQuery = supabase
    .from('topic_trend')
    .select('*')
    .eq('county_id', countyId)
    .eq('week_start', weekStart.toISOString().split('T')[0])
    .order('item_count', { ascending: false })
    .limit(5);
  
  if (topics.length > 0) {
    trendsQuery = trendsQuery.in('tag', topics);
  }
  
  const { data: trends } = await trendsQuery;
  
  // Get notable items (recent legislation)
  const { data: notableItems } = await supabase
    .from('legislation')
    .select('id, title, introduced_at')
    .in('jurisdiction_id', jurisdictionIds)
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5);
  
  return {
    snapshot: {
      newLegislation: newLegislation || 0,
      statusChanges: statusChanges || 0,
      upcomingMeetings: upcomingMeetings || 0,
      upcomingElections: upcomingElections || 0,
    },
    trends: (trends || []).map((t: any) => ({
      tag: t.tag,
      label: t.cluster_label,
      itemCount: t.item_count,
      cities: t.cities,
      summary: t.ai_summary,
      itemIds: t.item_ids,
    })),
    notableItems: (notableItems || []).map((item: any) => ({
      type: 'legislation',
      title: item.title,
      date: item.introduced_at,
      url: `${Deno.env.get('BASE_URL') || 'http://localhost:8080'}/details/legislation/${item.id}`,
    })),
  };
}

function generateDigestHTML(data: DigestData, userName: string, jurisdictionName: string): string {
  const baseUrl = Deno.env.get('BASE_URL') || 'http://localhost:8080';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Weekly Digest - Local Gov Watch</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 20px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0 0 10px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #1e40af; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; }
    .metric { background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6; }
    .metric-value { font-size: 28px; font-weight: bold; color: #1e40af; }
    .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .trend { background: #fefce8; border-left: 3px solid #f59e0b; padding: 15px; margin-bottom: 12px; border-radius: 6px; }
    .trend-tag { background: #f59e0b; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 8px; }
    .trend-cities { color: #64748b; font-size: 13px; margin-top: 5px; }
    .item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .item:last-child { border-bottom: none; }
    .item-title { color: #1e40af; text-decoration: none; font-weight: 500; }
    .item-title:hover { text-decoration: underline; }
    .item-date { color: #64748b; font-size: 13px; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ Local Gov Watch</h1>
    <p>Your weekly digest for ${jurisdictionName}</p>
  </div>
  
  <p>Hi ${userName},</p>
  <p>Here's what happened in local government this week:</p>
  
  <div class="section">
    <h2>📊 This Week's Snapshot</h2>
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${data.snapshot.newLegislation}</div>
        <div class="metric-label">New Legislation</div>
      </div>
      <div class="metric">
        <div class="metric-value">${data.snapshot.statusChanges}</div>
        <div class="metric-label">Status Changes</div>
      </div>
      <div class="metric">
        <div class="metric-value">${data.snapshot.upcomingMeetings}</div>
        <div class="metric-label">Meetings (Next 14 Days)</div>
      </div>
      <div class="metric">
        <div class="metric-value">${data.snapshot.upcomingElections}</div>
        <div class="metric-label">Elections (Next 90 Days)</div>
      </div>
    </div>
  </div>
  
  ${data.trends.length > 0 ? `
  <div class="section">
    <h2>🔥 Top Trends</h2>
    ${data.trends.map(trend => `
      <div class="trend">
        <span class="trend-tag">${trend.tag.toUpperCase()}</span>
        <div><strong>${trend.itemCount} items</strong> ${trend.label ? `· ${trend.label}` : ''}</div>
        ${trend.summary ? `<p style="margin: 8px 0;">${trend.summary}</p>` : ''}
        <div class="trend-cities">📍 ${trend.cities.join(', ')}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${data.notableItems.length > 0 ? `
  <div class="section">
    <h2>📌 Notable Items</h2>
    ${data.notableItems.map(item => `
      <div class="item">
        <a href="${item.url}" class="item-title">${item.title}</a>
        <div class="item-date">${new Date(item.date).toLocaleDateString()}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${baseUrl}/browse/legislation" class="button">Browse All Legislation</a>
    <a href="${baseUrl}/calendar" class="button">View Calendar</a>
  </div>
  
  <div class="footer">
    <p><a href="${baseUrl}/settings/digest" style="color: #3b82f6;">Customize your digest</a> · <a href="${baseUrl}" style="color: #3b82f6;">Local Gov Watch</a></p>
    <p style="margin-top: 10px; font-size: 12px;">Hyper-local. AI-smart. Costs dozens, not thousands.</p>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all users with weekly subscriptions
    const { data: subscriptions } = await supabase
      .from('subscription')
      .select(`
        id,
        user_id,
        scope,
        topics,
        query_json,
        profile:user_id (
          id,
          email,
          name,
          default_jurisdiction_id,
          jurisdiction:default_jurisdiction_id (
            id,
            name,
            type
          )
        )
      `)
      .eq('cadence', 'weekly')
      .eq('channel', 'email');
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No weekly subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const sent = [];
    
    for (const sub of subscriptions) {
      try {
        const profile = sub.profile as any;
        if (!profile?.default_jurisdiction_id) continue;
        
        const digestData = await buildDigestData(
          supabase,
          sub.user_id,
          sub.scope,
          sub.topics || [],
          profile.default_jurisdiction_id
        );
        
        const html = generateDigestHTML(
          digestData,
          profile.name || 'there',
          profile.jurisdiction?.name || 'your area'
        );
        
        // In production, send via email service
        // For now, log the digest
        console.log('Digest for', profile.email, ':', html.substring(0, 200));
        
        // Update last_sent_at
        await supabase
          .from('subscription')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', sub.id);
        
        sent.push(profile.email);
      } catch (error) {
        console.error('Error sending digest to', sub.user_id, error);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      sent: sent.length,
      recipients: sent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error generating digests:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
