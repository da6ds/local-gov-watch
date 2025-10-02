import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query: string;
  type?: 'legislation' | 'meeting' | 'all';
  jurisdictions?: string[];
  topics?: string[];
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { query, type = 'all', jurisdictions = [], topics = [], limit = 20, offset = 0 } = await req.json() as SearchParams;

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ results: [], total: 0, query: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Search request:', { query, type, jurisdictions, topics, limit, offset });

    // Get jurisdiction IDs if slugs provided
    let jurisdictionIds: string[] = [];
    if (jurisdictions.length > 0) {
      const { data: jurisdictionData } = await supabaseClient
        .from('jurisdiction')
        .select('id')
        .in('slug', jurisdictions);
      jurisdictionIds = jurisdictionData?.map(j => j.id) || [];
    }

    const results: any[] = [];

    // Search legislation if type is 'all' or 'legislation'
    if (type === 'all' || type === 'legislation') {
      let legislationQuery = supabaseClient
        .from('legislation')
        .select(`
          id,
          title,
          occurred_at,
          status,
          full_text,
          jurisdiction:jurisdiction_id(name, slug)
        `)
        .not('search_vector', 'is', null)
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        })
        .order('occurred_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (jurisdictionIds.length > 0) {
        legislationQuery = legislationQuery.in('jurisdiction_id', jurisdictionIds);
      }

      const { data: legislationData, error: legislationError } = await legislationQuery;

      if (legislationError) {
        console.error('Legislation search error:', legislationError);
      } else if (legislationData) {
        console.log('Legislation results:', legislationData.length);
        
        for (const item of legislationData) {
          // Create simple snippet from full_text
          const text = item.full_text || '';
          const snippet = text.slice(0, 200) + (text.length > 200 ? '...' : '');
          
          const jurisdiction = Array.isArray(item.jurisdiction) ? item.jurisdiction[0] : item.jurisdiction;

          results.push({
            id: item.id,
            type: 'legislation',
            title: item.title,
            snippet,
            jurisdiction: jurisdiction?.name || '',
            jurisdictionSlug: jurisdiction?.slug || '',
            date: item.occurred_at,
            status: item.status,
            url: `/legislation/${item.id}`
          });
        }
      }
    }

    // Search meetings if type is 'all' or 'meeting'
    if (type === 'all' || type === 'meeting') {
      let meetingQuery = supabaseClient
        .from('meeting')
        .select(`
          id,
          title,
          body_name,
          starts_at,
          ai_summary,
          jurisdiction:jurisdiction_id(name, slug)
        `)
        .not('search_vector', 'is', null)
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        })
        .order('starts_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (jurisdictionIds.length > 0) {
        meetingQuery = meetingQuery.in('jurisdiction_id', jurisdictionIds);
      }

      const { data: meetingData, error: meetingError } = await meetingQuery;

      if (meetingError) {
        console.error('Meeting search error:', meetingError);
      } else if (meetingData) {
        console.log('Meeting results:', meetingData.length);
        
        for (const item of meetingData) {
          // Create simple snippet from ai_summary
          const text = item.ai_summary || item.title;
          const snippet = text.slice(0, 200) + (text.length > 200 ? '...' : '');
          
          const jurisdiction = Array.isArray(item.jurisdiction) ? item.jurisdiction[0] : item.jurisdiction;

          results.push({
            id: item.id,
            type: 'meeting',
            title: item.title,
            snippet,
            jurisdiction: jurisdiction?.name || '',
            jurisdictionSlug: jurisdiction?.slug || '',
            date: item.starts_at,
            bodyName: item.body_name,
            url: `/meetings/${item.id}`
          });
        }
      }
    }

    // If filtering by topics, filter results
    if (topics.length > 0) {
      const itemIds = results.map(r => r.id);
      const { data: topicData } = await supabaseClient
        .from('item_topic')
        .select('item_id')
        .in('item_id', itemIds)
        .in('topic', topics);

      const topicItemIds = new Set(topicData?.map(t => t.item_id) || []);
      const filteredResults = results.filter(r => topicItemIds.has(r.id));
      
      return new Response(
        JSON.stringify({
          results: filteredResults,
          total: filteredResults.length,
          query
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Total results:', results.length);

    return new Response(
      JSON.stringify({
        results,
        total: results.length,
        query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [], total: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
