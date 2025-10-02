import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataStatusResponse {
  mode: 'live' | 'seed';
  reason: 'no-successful-runs' | 'tables-empty' | 'success-but-empty-window' | 'ok';
  lastRunAt: string | null;
  tableCounts: {
    meetings: number;
    legislation: number;
    elections: number;
  };
  scopeUsed: string;
  diagnostics: {
    enabledConnectors: number;
    recentRuns: number;
    jurisdictionSlugs: string[];
  };
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

    // Parse scope from query params
    const url = new URL(req.url);
    const scopeParam = url.searchParams.get('scope') || 'city:austin-tx,county:travis-county-tx,state:texas';
    
    // Extract jurisdiction slugs from scope
    const jurisdictionSlugs = scopeParam.split(',').map(s => {
      const match = s.trim().match(/^(?:city|county|state):(.+)$/);
      return match ? match[1] : s.trim();
    });

    console.log('Data status check for scope:', scopeParam, 'slugs:', jurisdictionSlugs);

    // Get jurisdiction IDs from slugs
    const { data: jurisdictions } = await supabase
      .from('jurisdiction')
      .select('id, slug')
      .in('slug', jurisdictionSlugs);

    const jurisdictionIds = jurisdictions?.map(j => j.id) || [];

    // Count enabled connectors in scope
    const { data: enabledConnectors } = await supabase
      .from('connector')
      .select('id, jurisdiction_slug, kind, last_run_at, last_status')
      .in('jurisdiction_slug', jurisdictionSlugs)
      .eq('enabled', true);

    const enabledCount = enabledConnectors?.length || 0;

    // Check for recent successful connector runs (within 72 hours)
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    
    const recentSuccessfulConnectors = enabledConnectors?.filter(c => 
      c.last_run_at && 
      c.last_run_at > seventyTwoHoursAgo &&
      c.last_status === 'success'
    ) || [];

    const recentRunCount = recentSuccessfulConnectors.length;
    const lastRunAt = recentSuccessfulConnectors.length > 0 
      ? recentSuccessfulConnectors.sort((a, b) => 
          (b.last_run_at || '').localeCompare(a.last_run_at || '')
        )[0].last_run_at
      : null;

    // Count actual table rows within scope
    const [meetingsResult, legislationResult, electionsResult] = await Promise.all([
      supabase
        .from('meeting')
        .select('id', { count: 'exact', head: true })
        .in('jurisdiction_id', jurisdictionIds),
      supabase
        .from('legislation')
        .select('id', { count: 'exact', head: true })
        .in('jurisdiction_id', jurisdictionIds),
      supabase
        .from('election')
        .select('id', { count: 'exact', head: true })
        .in('jurisdiction_id', jurisdictionIds)
    ]);

    const tableCounts = {
      meetings: meetingsResult.count || 0,
      legislation: legislationResult.count || 0,
      elections: electionsResult.count || 0
    };

    const totalRows = tableCounts.meetings + tableCounts.legislation + tableCounts.elections;

    // Determine mode and reason
    let mode: 'live' | 'seed' = 'seed';
    let reason: DataStatusResponse['reason'] = 'no-successful-runs';

    if (recentRunCount === 0) {
      mode = 'seed';
      reason = 'no-successful-runs';
    } else if (totalRows === 0) {
      mode = 'seed';
      reason = 'tables-empty';
    } else {
      mode = 'live';
      reason = 'ok';
    }

    const response: DataStatusResponse = {
      mode,
      reason,
      lastRunAt,
      tableCounts,
      scopeUsed: scopeParam,
      diagnostics: {
        enabledConnectors: enabledCount,
        recentRuns: recentRunCount,
        jurisdictionSlugs
      }
    };

    console.log('Data status result:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in data-status:', error);
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
