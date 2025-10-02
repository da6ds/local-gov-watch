import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') || '';
    const topicsParam = url.searchParams.get('topics') || '';
    const topics = topicsParam ? topicsParam.split(',').filter(Boolean) : [];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse scope into jurisdiction slugs
    const jurisdictionSlugs = scope.split(',').map((s: string) => {
      const parts = s.split(':');
      return parts[1] || parts[0];
    }).filter(Boolean);

    // Get jurisdiction IDs
    const { data: jurisdictions } = await supabase
      .from('jurisdiction')
      .select('id')
      .in('slug', jurisdictionSlugs.length > 0 ? jurisdictionSlugs : ['austin-tx']);
    
    const jurisdictionIds = jurisdictions?.map(j => j.id) || [];

    if (jurisdictionIds.length === 0) {
      return new Response(
        JSON.stringify({ legislation: [], meetings: [], elections: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build base queries
    let legislationQuery = supabase
      .from('legislation')
      .select('*')
      .in('jurisdiction_id', jurisdictionIds)
      .order('introduced_at', { ascending: false })
      .limit(10);

    let meetingsQuery = supabase
      .from('meeting')
      .select('*')
      .in('jurisdiction_id', jurisdictionIds)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(10);

    let electionsQuery = supabase
      .from('election')
      .select('*')
      .in('jurisdiction_id', jurisdictionIds)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(10);

    // If topics are provided, filter by item_topic
    if (topics.length > 0) {
      // Get item IDs that match the topics
      const { data: topicMatches } = await supabase
        .from('item_topic')
        .select('item_id, item_type')
        .in('topic', topics)
        .in('jurisdiction_id', jurisdictionIds);

      if (topicMatches && topicMatches.length > 0) {
        const legislationIds = topicMatches
          .filter(m => m.item_type === 'legislation')
          .map(m => m.item_id);
        const meetingIds = topicMatches
          .filter(m => m.item_type === 'meeting')
          .map(m => m.item_id);
        const electionIds = topicMatches
          .filter(m => m.item_type === 'election')
          .map(m => m.item_id);

        if (legislationIds.length > 0) {
          legislationQuery = legislationQuery.in('id', legislationIds);
        } else {
          legislationQuery = legislationQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }

        if (meetingIds.length > 0) {
          meetingsQuery = meetingsQuery.in('id', meetingIds);
        } else {
          meetingsQuery = meetingsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }

        if (electionIds.length > 0) {
          electionsQuery = electionsQuery.in('id', electionIds);
        } else {
          electionsQuery = electionsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      } else {
        // No matches, return empty
        return new Response(
          JSON.stringify({ legislation: [], meetings: [], elections: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Execute queries
    const [legislationResult, meetingsResult, electionsResult] = await Promise.all([
      legislationQuery,
      meetingsQuery,
      electionsQuery,
    ]);

    return new Response(
      JSON.stringify({
        legislation: legislationResult.data || [],
        meetings: meetingsResult.data || [],
        elections: electionsResult.data || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dashboard API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
