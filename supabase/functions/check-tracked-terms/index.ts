import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackedTerm {
  id: string;
  email: string;
  name: string;
  keywords: string[];
  jurisdictions: string[];
  active: boolean;
  alert_enabled: boolean;
  match_count: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { itemType, itemId } = await req.json();

    console.log(`Checking tracked terms for ${itemType}: ${itemId}`);

    // Get the item content
    let content = '';
    let jurisdictionId: string;
    
    if (itemType === 'legislation') {
      const { data, error } = await supabase
        .from('legislation')
        .select('title, ai_summary, full_text, jurisdiction_id')
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Item not found');
      
      content = `${data.title} ${data.ai_summary || ''} ${data.full_text || ''}`.toLowerCase();
      jurisdictionId = data.jurisdiction_id;
    } else if (itemType === 'meeting') {
      const { data, error } = await supabase
        .from('meeting')
        .select('title, ai_summary, extracted_text, jurisdiction_id')
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Item not found');
      
      content = `${data.title} ${data.ai_summary || ''} ${data.extracted_text || ''}`.toLowerCase();
      jurisdictionId = data.jurisdiction_id;
    } else {
      throw new Error('Invalid item type');
    }

    // Get jurisdiction slug
    const { data: jurisdiction } = await supabase
      .from('jurisdiction')
      .select('slug')
      .eq('id', jurisdictionId)
      .single();

    if (!jurisdiction) {
      console.log('No jurisdiction found for item');
      return new Response(JSON.stringify({ matches: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jurisdictionSlug = jurisdiction.slug;

    // Get all active tracked terms
    const { data: trackedTerms, error: termsError } = await supabase
      .from('tracked_term')
      .select('*')
      .eq('active', true);

    if (termsError) throw termsError;

    let matchCount = 0;

    // Check each tracked term
    for (const term of (trackedTerms as TrackedTerm[])) {
      // Check if item's jurisdiction matches term's locations
      const jurisdictions = term.jurisdictions as string[];
      if (!jurisdictions.includes(jurisdictionSlug)) {
        continue;
      }

      // Check if any keywords appear in content (case-insensitive)
      const matchedKeywords = term.keywords.filter((keyword: string) =>
        content.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        console.log(`Found match for term "${term.name}": ${matchedKeywords.join(', ')}`);

        // Insert match (ignore if already exists due to unique constraint)
        const { error: insertError } = await supabase
          .from('term_match')
          .insert({
            tracked_term_id: term.id,
            item_type: itemType,
            item_id: itemId,
            matched_keywords: matchedKeywords,
          });

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Error inserting match:', insertError);
        } else if (!insertError) {
          // Update match count
          const { error: updateError } = await supabase
            .from('tracked_term')
            .update({
              match_count: term.match_count + 1,
              last_checked_at: new Date().toISOString(),
            })
            .eq('id', term.id);

          if (updateError) {
            console.error('Error updating match count:', updateError);
          } else {
            matchCount++;
          }
        }
      }
    }

    console.log(`Created ${matchCount} new matches`);

    return new Response(
      JSON.stringify({ matches: matchCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-tracked-terms:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
