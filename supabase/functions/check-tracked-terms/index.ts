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

interface AlertData {
  email: string;
  termName: string;
  matchedKeywords: string[];
  item: any;
  itemType: 'legislation' | 'meeting';
  jurisdiction: string;
}

async function sendTrackedTermAlert(data: AlertData) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://preview--local-gov-watch.lovable.app';
  const itemUrl = `${frontendUrl}/${data.itemType === 'legislation' ? 'legislation' : 'meetings'}/${data.item.id}`;
  
  const subject = `🚨 New Match: ${data.termName}`;
  
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">🚨 Alert: New Match Found</h2>
      
      <p style="color: #374151; font-size: 16px;">Your tracked term "<strong>${data.termName}</strong>" has a new match:</p>
      
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f9fafb;">
        <h3 style="margin-top: 0; color: #111827;">${data.item.title}</h3>
        <p style="margin: 8px 0; color: #6b7280;"><strong>Type:</strong> ${data.itemType === 'legislation' ? 'Legislation' : 'Meeting'}</p>
        <p style="margin: 8px 0; color: #6b7280;"><strong>Location:</strong> ${data.jurisdiction}</p>
        <p style="margin: 8px 0; color: #6b7280;"><strong>Keywords matched:</strong> ${data.matchedKeywords.join(', ')}</p>
        ${data.item.ai_summary ? `<p style="margin: 12px 0 0 0; color: #374151;"><strong>Summary:</strong> ${data.item.ai_summary}</p>` : ''}
      </div>
      
      <p style="text-align: center; margin: 24px 0;">
        <a href="${itemUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Full Document</a>
      </p>
      
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        You're receiving this because you have alerts enabled for "${data.termName}".
        <br>
        <a href="${frontendUrl}/tracked-terms" style="color: #2563eb; text-decoration: none;">Manage your tracked terms</a>
      </p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Local Gov Watch <onboarding@resend.dev>',
      to: [data.email],
      subject,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
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

        // Check if already sent alert for this match
        const { data: existingMatch } = await supabase
          .from('term_match')
          .select('id, notified')
          .eq('tracked_term_id', term.id)
          .eq('item_id', itemId)
          .single();

        if (existingMatch) {
          console.log('Match already exists, skipping');
          continue;
        }

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

            // Send alert email if enabled
            if (term.alert_enabled) {
              try {
                const item = itemType === 'legislation' 
                  ? { id: itemId, title: content.split('\n')[0], ai_summary: null }
                  : { id: itemId, title: content.split('\n')[0], ai_summary: null };

                // Get full item details
                const { data: fullItem } = await supabase
                  .from(itemType)
                  .select('id, title, ai_summary')
                  .eq('id', itemId)
                  .single();

                if (fullItem) {
                  await sendTrackedTermAlert({
                    email: term.email,
                    termName: term.name,
                    matchedKeywords,
                    item: fullItem,
                    itemType,
                    jurisdiction: jurisdictionSlug
                  });

                  // Mark as notified
                  await supabase
                    .from('term_match')
                    .update({ notified: true })
                    .eq('tracked_term_id', term.id)
                    .eq('item_id', itemId);

                  console.log(`Sent alert email to ${term.email}`);
                }
              } catch (alertError) {
                console.error('Failed to send alert email:', alertError);
                // Don't fail the match insertion if email fails
              }
            }
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
