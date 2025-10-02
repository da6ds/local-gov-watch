import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

export interface DigestData {
  legislation: Array<{
    id: string;
    title: string;
    status: string | null;
    occurred_at: string | null;
    jurisdiction_name: string;
    ai_summary: string | null;
    summary: string | null;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    body_name: string;
    starts_at: string;
    location: string | null;
    agenda_url: string | null;
    jurisdiction_name: string;
  }>;
  trends: Array<{
    topic: string;
    count: number;
  }>;
}

export async function fetchDigestData(
  locations: string[],
  topics: string[] | null
): Promise<DigestData> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch jurisdiction IDs for locations
  const { data: jurisdictions } = await supabase
    .from('jurisdiction')
    .select('id, slug, name')
    .in('slug', locations);

  const jurisdictionIds = jurisdictions?.map((j) => j.id) || [];
  const jurisdictionMap = new Map(jurisdictions?.map((j) => [j.id, j.name]) || []);

  // Fetch recent legislation (last 7 days)
  let legislationQuery = supabase
    .from('legislation')
    .select('id, title, status, occurred_at, jurisdiction_id, ai_summary, summary')
    .in('jurisdiction_id', jurisdictionIds)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  // Filter by topics if provided
  if (topics && topics.length > 0) {
    const { data: topicItems } = await supabase
      .from('item_topic')
      .select('item_id')
      .eq('item_type', 'legislation')
      .in('topic', topics);
    
    const topicItemIds = topicItems?.map((t) => t.item_id) || [];
    if (topicItemIds.length > 0) {
      legislationQuery = legislationQuery.in('id', topicItemIds);
    }
  }

  const { data: legislation } = await legislationQuery;

  // Fetch upcoming meetings (next 14 days)
  let meetingsQuery = supabase
    .from('meeting')
    .select('id, title, body_name, starts_at, location, agenda_url, jurisdiction_id')
    .in('jurisdiction_id', jurisdictionIds)
    .gte('starts_at', new Date().toISOString())
    .lte('starts_at', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
    .order('starts_at', { ascending: true })
    .limit(5);

  // Filter by topics if provided
  if (topics && topics.length > 0) {
    const { data: topicItems } = await supabase
      .from('item_topic')
      .select('item_id')
      .eq('item_type', 'meeting')
      .in('topic', topics);
    
    const topicItemIds = topicItems?.map((t) => t.item_id) || [];
    if (topicItemIds.length > 0) {
      meetingsQuery = meetingsQuery.in('id', topicItemIds);
    }
  }

  const { data: meetings } = await meetingsQuery;

  // Fetch trending topics
  const scopeKey = [...locations].sort().join(',');
  const { data: trends } = await supabase
    .from('trend_aggregate')
    .select('*')
    .eq('scope_key', scopeKey)
    .eq('time_window', '7d')
    .order('score', { ascending: false })
    .limit(3);

  // Filter trends by topics if provided
  let filteredTrends = trends || [];
  if (topics && topics.length > 0) {
    filteredTrends = filteredTrends.filter((t) => topics.includes(t.topic));
  }

  return {
    legislation: (legislation || []).map((item) => ({
      ...item,
      jurisdiction_name: jurisdictionMap.get(item.jurisdiction_id) || 'Unknown',
    })),
    meetings: (meetings || []).map((item) => ({
      ...item,
      jurisdiction_name: jurisdictionMap.get(item.jurisdiction_id) || 'Unknown',
    })),
    trends: filteredTrends.map((t) => ({
      topic: t.topic,
      count: t.count,
    })),
  };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
