import { supabase } from "@/integrations/supabase/client";
import { format, subDays, addDays } from "date-fns";

export interface DigestData {
  legislation: Array<{
    id: string;
    title: string;
    status: string | null;
    occurred_at: string | null;
    jurisdictionName: string;
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
    jurisdictionName: string;
  }>;
  trends: Array<{
    topic: string;
    count: number;
  }>;
}

export async function getPreviewLegislation(locations: string[], topics: string[]) {
  if (locations.length === 0) return [];
  
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  
  // Get jurisdiction IDs
  const { data: jurisdictions } = await supabase
    .from('jurisdiction')
    .select('id, slug, name')
    .in('slug', locations);
  
  if (!jurisdictions || jurisdictions.length === 0) return [];
  
  const jurisdictionIds = jurisdictions.map(j => j.id);
  
  // Get legislation - filter by introduced_at (when legislation was introduced)
  // but use created_at for the "new in last 7 days" filter since that tracks when we added it
  let query = supabase
    .from('legislation')
    .select('id, title, ai_summary, summary, tags, introduced_at, jurisdiction_id')
    .in('jurisdiction_id', jurisdictionIds)
    .gte('created_at', sevenDaysAgo)
    .order('introduced_at', { ascending: false })
    .limit(5);
  
  // Filter by topics if selected
  if (topics.length > 0) {
    const { data: topicItems } = await supabase
      .from('item_topic')
      .select('item_id')
      .eq('item_type', 'legislation')
      .in('topic', topics);
    
    const itemIds = topicItems?.map(t => t.item_id) || [];
    if (itemIds.length > 0) {
      query = query.in('id', itemIds);
    } else {
      return [];
    }
  }
  
  const { data } = await query;
  
  // Enrich with jurisdiction names
  return (data || []).map(item => ({
    ...item,
    jurisdictionName: jurisdictions.find(j => j.id === item.jurisdiction_id)?.name
  }));
}

export async function getPreviewMeetings(locations: string[], topics: string[]) {
  if (locations.length === 0) return [];
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const twoWeeksLater = format(addDays(new Date(), 14), 'yyyy-MM-dd');
  
  // Get jurisdiction IDs
  const { data: jurisdictions } = await supabase
    .from('jurisdiction')
    .select('id, slug, name')
    .in('slug', locations);
  
  if (!jurisdictions || jurisdictions.length === 0) return [];
  
  const jurisdictionIds = jurisdictions.map(j => j.id);
  
  // Get upcoming meetings
  let query = supabase
    .from('meeting')
    .select('id, title, body_name, starts_at, jurisdiction_id, ai_summary')
    .in('jurisdiction_id', jurisdictionIds)
    .gte('starts_at', today)
    .lte('starts_at', twoWeeksLater)
    .order('starts_at', { ascending: true })
    .limit(5);
  
  // Filter by topics if selected
  if (topics.length > 0) {
    const { data: topicItems } = await supabase
      .from('item_topic')
      .select('item_id')
      .eq('item_type', 'meeting')
      .in('topic', topics);
    
    const itemIds = topicItems?.map(t => t.item_id) || [];
    if (itemIds.length > 0) {
      query = query.in('id', itemIds);
    } else {
      return [];
    }
  }
  
  const { data } = await query;
  
  // Enrich with jurisdiction names
  return (data || []).map(item => ({
    ...item,
    jurisdictionName: jurisdictions.find(j => j.id === item.jurisdiction_id)?.name
  }));
}

export async function getPreviewTrends(locations: string[], topics: string[]) {
  if (locations.length === 0) return [];
  
  const scopeKey = locations.sort().join(',');
  
  let query = supabase
    .from('trend_aggregate')
    .select('*')
    .eq('scope_key', scopeKey)
    .eq('time_window', '7d')
    .order('score', { ascending: false })
    .limit(3);
  
  if (topics.length > 0) {
    query = query.in('topic', topics);
  }
  
  const { data } = await query;
  return data || [];
}
