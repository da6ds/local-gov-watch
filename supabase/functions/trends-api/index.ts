import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendItem {
  topic: string;
  score: number;
  count: number;
  by_kind: {
    legislation?: number;
    meeting?: number;
    election?: number;
  };
  sample_item_ids: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const scopeParam = url.searchParams.get('scope') || 'austin-tx,travis-county-tx,texas';
    const timeWindow = url.searchParams.get('window') || '7d';
    const topicsParam = url.searchParams.get('topics') || '';
    const topics = topicsParam ? topicsParam.split(',').filter(Boolean) : [];

    // Normalize scope key (sorted, deduped)
    const scopeParts = scopeParam.split(',').map(s => {
      const trimmed = s.trim();
      // Remove prefix if present
      const match = trimmed.match(/^(?:city|county|state):(.+)$/);
      return match ? match[1] : trimmed;
    }).sort();
    const scopeKey = scopeParts.join(',');

    console.log('Trends API - scope:', scopeKey, 'window:', timeWindow, 'topics:', topics);

    // Query trend_aggregate table
    let query = supabase
      .from('trend_aggregate')
      .select('*')
      .eq('scope_key', scopeKey)
      .eq('time_window', timeWindow)
      .order('score', { ascending: false })
      .limit(20);

    // Filter by topics if provided
    if (topics.length > 0) {
      query = query.in('topic', topics);
    }

    const { data: aggregates, error } = await query;

    if (error) {
      console.error('Error fetching trend aggregates:', error);
      throw error;
    }

    // If no aggregates found, compute on-the-fly from item_topic
    if (!aggregates || aggregates.length === 0) {
      console.log('No precomputed trends, computing on-the-fly...');
      
      // Get jurisdiction IDs from scope
      const { data: jurisdictions } = await supabase
        .from('jurisdiction')
        .select('id')
        .in('slug', scopeParts);

      if (!jurisdictions || jurisdictions.length === 0) {
        return new Response(
          JSON.stringify({ items: [], generatedAt: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const jurisdictionIds = jurisdictions.map(j => j.id);

      // Calculate time bounds
      const now = new Date();
      let startTime = new Date(now);
      
      switch (timeWindow) {
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
        case '6m':
          startTime.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          startTime.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Query item_topic for counts
      let topicQuery = supabase
        .from('item_topic')
        .select('topic, item_kind, item_id')
        .in('jurisdiction_id', jurisdictionIds)
        .gte('occurred_at', startTime.toISOString())
        .lte('occurred_at', now.toISOString());

      if (topics.length > 0) {
        topicQuery = topicQuery.in('topic', topics);
      }

      const { data: topicItems } = await topicQuery;

      if (!topicItems || topicItems.length === 0) {
        return new Response(
          JSON.stringify({ items: [], generatedAt: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Aggregate by topic
      const topicCounts: { [key: string]: { 
        count: number; 
        by_kind: { [kind: string]: number };
        item_ids: Set<string>;
      } } = {};

      topicItems.forEach(item => {
        if (!topicCounts[item.topic]) {
          topicCounts[item.topic] = { 
            count: 0, 
            by_kind: {}, 
            item_ids: new Set() 
          };
        }
        topicCounts[item.topic].count++;
        topicCounts[item.topic].by_kind[item.item_kind] = 
          (topicCounts[item.topic].by_kind[item.item_kind] || 0) + 1;
        topicCounts[item.topic].item_ids.add(item.item_id);
      });

      // Convert to trend items with simple score
      const trendItems: TrendItem[] = Object.entries(topicCounts)
        .map(([topic, data]) => ({
          topic,
          score: data.count, // Simple count-based score
          count: data.count,
          by_kind: data.by_kind,
          sample_item_ids: Array.from(data.item_ids).slice(0, 5)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      return new Response(
        JSON.stringify({ items: trendItems, generatedAt: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return precomputed aggregates
    const trendItems: TrendItem[] = aggregates.map(agg => ({
      topic: agg.topic,
      score: agg.score,
      count: agg.count,
      by_kind: agg.by_kind || {},
      sample_item_ids: agg.sample_item_ids || []
    }));

    return new Response(
      JSON.stringify({ 
        items: trendItems, 
        generatedAt: new Date().toISOString(),
        precomputed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trends-api:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
