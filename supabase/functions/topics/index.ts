import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Canonical topics list
const CANONICAL_TOPICS = [
  { slug: 'zoning', label: 'Zoning & Land Use' },
  { slug: 'short-term-rentals', label: 'Short-Term Rentals' },
  { slug: 'budget', label: 'Budget & Finance' },
  { slug: 'water', label: 'Water & Conservation' },
  { slug: 'transportation', label: 'Transportation' },
  { slug: 'housing', label: 'Housing & Homelessness' },
  { slug: 'environment', label: 'Environment & Climate' },
  { slug: 'parks', label: 'Parks & Recreation' },
  { slug: 'police', label: 'Police & Public Safety' },
  { slug: 'fire', label: 'Fire & Emergency Services' },
  { slug: 'taxes', label: 'Taxes & Revenue' },
];

// Topic aliases for keyword fallback
export const TOPIC_ALIASES: Record<string, string[]> = {
  'zoning': ['zoning', 'land use', 'platting', 'variance', 'rezoning'],
  'short-term-rentals': ['short-term rental', 'STR', 'airbnb', 'vacation rental'],
  'budget': ['budget', 'appropriation', 'general fund', 'fiscal'],
  'water': ['water', 'drought', 'conservation', 'wastewater'],
  'transportation': ['transit', 'bus', 'rail', 'traffic', 'mobility', 'road'],
  'housing': ['housing', 'affordable', 'homeless', 'shelter'],
  'environment': ['environment', 'climate', 'sustainability', 'green', 'pollution'],
  'parks': ['park', 'recreation', 'trail', 'greenspace'],
  'police': ['police', 'public safety', 'crime', 'enforcement'],
  'fire': ['fire', 'emergency', 'EMS'],
  'taxes': ['tax', 'property tax', 'rate', 'levy'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return new Response(
      JSON.stringify(CANONICAL_TOPICS),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Topics API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch topics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
