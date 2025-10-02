import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendsRequest {
  scope: string;
  time_window?: '7d' | '30d' | '6m' | '1y';
  topics?: string[];
  limit?: number;
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
    const scope = url.searchParams.get('scope') || 'austin-tx,travis-county-tx,texas';
    const timeWindow = (url.searchParams.get('window') || '7d') as '7d' | '30d' | '6m' | '1y';
    const topicsParam = url.searchParams.get('topics') || '';
    const topics = topicsParam ? topicsParam.split(',').filter(Boolean) : [];
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Parse scope into jurisdiction slugs
    const jurisdictionSlugs = scope.split(',').map((s: string) => {
      const parts = s.split(':');
      return parts[1] || parts[0];
    }).filter(Boolean);

    console.log('Trends API - scope:', scope, 'window:', timeWindow, 'topics:', topics);

    // Get jurisdiction IDs
    const { data: jurisdictions } = await supabase
      .from('jurisdiction')
      .select('id, slug')
      .in('slug', jurisdictionSlugs.length > 0 ? jurisdictionSlugs : ['austin-tx']);
    
    const jurisdictionIds = jurisdictions?.map(j => j.id) || [];

    if (jurisdictionIds.length === 0) {
      return new Response(
        JSON.stringify({ items: [], generatedAt: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create normalized scope key for trend_aggregate lookup
    const normalizedScopeKey = jurisdictionSlugs.sort().join(',');

    // Try to get precomputed trends from trend_aggregate table
    let trendsQuery = supabase
      .from('trend_aggregate')
      .select('*')
      .eq('scope_key', normalizedScopeKey)
      .eq('time_window', timeWindow)
      .order('score', { ascending: false })
      .limit(limit);

    // Filter by topics if provided
    if (topics.length > 0) {
      trendsQuery = trendsQuery.in('topic', topics);
    }

    const { data: precomputedTrends } = await trendsQuery;

    // If we have precomputed trends, return them
    if (precomputedTrends && precomputedTrends.length > 0) {
      console.log('Returning precomputed trends:', precomputedTrends.length);
      return new Response(
        JSON.stringify({
          items: precomputedTrends.map(t => ({
            topic: t.topic,
            score: t.score,
            count: t.count,
            byKind: t.by_kind || {},
            sampleItemIds: t.sample_item_ids || [],
            lastComputed: t.last_computed_at
          })),
          generatedAt: new Date().toISOString(),
          source: 'precomputed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: compute trends on-the-fly from item_topic table
    console.log('Computing trends on-the-fly from item_topic');

    // Get time bounds
    const now = new Date();
    let startTime = new Date();
    switch (timeWindow) {
      case '7d': startTime.setDate(now.getDate() - 7); break;
      case '30d': startTime.setDate(now.getDate() - 30); break;
      case '6m': startTime.setMonth(now.getMonth() - 6); break;
      case '1y': startTime.setFullYear(now.getFullYear() - 1); break;
    }

    // Query item_topic for the time window
    let itemTopicQuery = supabase
      .from('item_topic')
      .select('topic, item_kind, item_id')
      .in('jurisdiction_id', jurisdictionIds)
      .gte('occurred_at', startTime.toISOString())
      .lte('occurred_at', now.toISOString());

    if (topics.length > 0) {
      itemTopicQuery = itemTopicQuery.in('topic', topics);
    }

    const { data: itemTopics } = await itemTopicQuery;

    // Aggregate by topic
    const topicCounts = new Map<string, {
      count: number;
      byKind: { legislation: number; meeting: number; election: number };
      itemIds: string[];
    }>();

    itemTopics?.forEach(item => {
      if (!topicCounts.has(item.topic)) {
        topicCounts.set(item.topic, {
          count: 0,
          byKind: { legislation: 0, meeting: 0, election: 0 },
          itemIds: []
        });
      }
      const entry = topicCounts.get(item.topic)!;
      entry.count++;
      if (item.item_kind === 'legislation') entry.byKind.legislation++;
      else if (item.item_kind === 'meeting') entry.byKind.meeting++;
      else if (item.item_kind === 'election') entry.byKind.election++;
      if (entry.itemIds.length < 5) {
        entry.itemIds.push(item.item_id);
      }
    });

    // Convert to array and sort by count
    const trends = Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic,
        score: data.count, // Simple score = count for on-the-fly computation
        count: data.count,
        byKind: data.byKind,
        sampleItemIds: data.itemIds
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    console.log('Computed trends:', trends.length);

    return new Response(
      JSON.stringify({
        items: trends,
        generatedAt: new Date().toISOString(),
        source: 'computed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trends API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});