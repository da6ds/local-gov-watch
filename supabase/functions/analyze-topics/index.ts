import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keyword map for free tagging
const KEYWORD_MAP: Record<string, string[]> = {
  'zoning': ['zoning', 'land use', 'platting', 'variance', 'rezoning'],
  'short-term-rentals': ['short-term rental', 'str', 'airbnb', 'vrbo'],
  'budget': ['budget', 'appropriation', 'fiscal', 'funding', 'general fund'],
  'water': ['water', 'drought', 'conservation', 'aquifer', 'watershed'],
  'transportation': ['transit', 'bus', 'rail', 'traffic', 'mobility', 'parking'],
  'housing': ['housing', 'affordable housing', 'homelessness', 'residential'],
  'environment': ['environment', 'climate', 'sustainability', 'green', 'pollution'],
  'parks': ['parks', 'recreation', 'trails', 'open space'],
  'police': ['police', 'law enforcement', 'public safety', 'apd'],
  'fire': ['fire', 'ems', 'emergency', 'afd'],
  'taxes': ['tax', 'property tax', 'rate', 'levy']
};

interface ContentItem {
  id: string;
  type: 'legislation' | 'meeting';
  title: string;
  summary?: string;
  ai_summary?: string;
  full_text?: string;
  extracted_text?: string;
  embedding?: number[];
  jurisdiction_slug?: string;
  tags?: string[];
}

function assignKeywordTags(text: string): string[] {
  const lowerText = text.toLowerCase();
  const tags = new Set<string>();
  
  for (const [tag, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      tags.add(tag);
    }
  }
  
  return Array.from(tags);
}

async function assignAITags(items: ContentItem[], lovableApiKey: string): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  
  // Batch items without keyword tags
  const untaggedItems = items.filter(item => {
    const text = [item.title, item.summary, item.ai_summary].filter(Boolean).join(' ');
    return assignKeywordTags(text).length === 0;
  });
  
  if (untaggedItems.length === 0) return results;
  
  // Batch up to 50 items per request
  const batchSize = 50;
  for (let i = 0; i < untaggedItems.length; i += batchSize) {
    const batch = untaggedItems.slice(i, i + batchSize);
    
    try {
      const prompt = `Classify these government items into 1-2 tags from: ${Object.keys(KEYWORD_MAP).join(', ')}.
Return JSON array: [{"id": "uuid", "tags": ["tag1", "tag2"]}]

Items:
${batch.map(item => `ID: ${item.id}
Title: ${item.title}
Summary: ${item.summary || item.ai_summary || 'N/A'}`).join('\n\n')}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a topic classifier for local government content. Return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
        }),
      });
      
      if (!response.ok) {
        console.error('AI classification failed:', response.status);
        continue;
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const classified = JSON.parse(content);
      
      for (const item of classified) {
        results.set(item.id, item.tags || []);
      }
    } catch (error) {
      console.error('AI batch classification error:', error);
    }
  }
  
  return results;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

async function clusterByEmbeddings(items: ContentItem[], threshold = 0.82): Promise<Map<string, string[]>> {
  const clusters = new Map<string, string[]>();
  const processed = new Set<string>();
  
  for (let i = 0; i < items.length; i++) {
    if (processed.has(items[i].id) || !items[i].embedding) continue;
    
    const cluster: string[] = [items[i].id];
    processed.add(items[i].id);
    
    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(items[j].id) || !items[j].embedding) continue;
      
      const similarity = cosineSimilarity(items[i].embedding!, items[j].embedding!);
      if (similarity >= threshold) {
        cluster.push(items[j].id);
        processed.add(items[j].id);
      }
    }
    
    if (cluster.length > 1) {
      clusters.set(`cluster_${i}`, cluster);
    }
  }
  
  return clusters;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { countyId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const aiEnabled = Deno.env.get('AI_ENABLE') !== 'false';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get week start (last Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    // Get county and its cities
    const { data: county } = await supabase
      .from('jurisdiction')
      .select('id, name, slug')
      .eq('id', countyId)
      .single();
    
    if (!county) {
      return new Response(JSON.stringify({ error: 'County not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { data: cities } = await supabase
      .from('jurisdiction')
      .select('id, slug')
      .eq('parent_jurisdiction_id', countyId);
    
    const jurisdictionIds = [countyId, ...(cities || []).map(c => c.id)];
    
    // Fetch this week's content
    const { data: legislation } = await supabase
      .from('legislation')
      .select('id, title, summary, ai_summary, full_text, tags, embedding, jurisdiction_id')
      .in('jurisdiction_id', jurisdictionIds)
      .gte('created_at', weekStart.toISOString());
    
    const { data: meetings } = await supabase
      .from('meeting')
      .select('id, title, ai_summary, extracted_text, embedding, jurisdiction_id')
      .in('jurisdiction_id', jurisdictionIds)
      .gte('created_at', weekStart.toISOString());
    
    const items: ContentItem[] = [
      ...(legislation || []).map(l => ({ 
        ...l, 
        type: 'legislation' as const,
        jurisdiction_slug: cities?.find(c => c.id === l.jurisdiction_id)?.slug || county.slug
      })),
      ...(meetings || []).map(m => ({ 
        ...m, 
        type: 'meeting' as const,
        jurisdiction_slug: cities?.find(c => c.id === m.jurisdiction_id)?.slug || county.slug
      }))
    ];
    
    if (items.length === 0) {
      return new Response(JSON.stringify({ message: 'No new items this week' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Step A: Keyword tagging
    const itemTags = new Map<string, Set<string>>();
    for (const item of items) {
      const text = [item.title, item.summary, item.ai_summary].filter(Boolean).join(' ');
      const tags = assignKeywordTags(text);
      itemTags.set(item.id, new Set([...(item.tags || []), ...tags]));
    }
    
    // Step B: AI tagging (if enabled and budget allows)
    if (aiEnabled) {
      const aiTags = await assignAITags(items, lovableApiKey);
      for (const [id, tags] of aiTags.entries()) {
        const existing = itemTags.get(id) || new Set();
        tags.forEach(t => existing.add(t));
        itemTags.set(id, existing);
      }
    }
    
    // Step C: Cluster by embeddings
    const clusters = await clusterByEmbeddings(items);
    
    // Build topic trends
    const tagGroups = new Map<string, string[]>();
    for (const [id, tags] of itemTags.entries()) {
      for (const tag of tags) {
        if (!tagGroups.has(tag)) tagGroups.set(tag, []);
        tagGroups.get(tag)!.push(id);
      }
    }
    
    const trends = [];
    for (const [tag, itemIds] of tagGroups.entries()) {
      if (itemIds.length < 2) continue; // Skip single items
      
      const citySet = new Set(
        itemIds.map(id => items.find(i => i.id === id)?.jurisdiction_slug).filter(Boolean)
      );
      
      trends.push({
        county_id: countyId,
        week_start: weekStart.toISOString().split('T')[0],
        tag,
        item_ids: itemIds,
        cities: Array.from(citySet),
        item_count: itemIds.length,
        cluster_label: null,
      });
    }
    
    // Insert trends
    if (trends.length > 0) {
      await supabase.from('topic_trend').delete()
        .eq('county_id', countyId)
        .eq('week_start', weekStart.toISOString().split('T')[0]);
      
      await supabase.from('topic_trend').insert(trends);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      trends: trends.length,
      items_analyzed: items.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error analyzing topics:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
