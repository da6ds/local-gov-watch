import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RunUpdateRequest {
  scope?: string;
  sessionId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { scope, sessionId } = await req.json() as RunUpdateRequest;
    const resolvedScope = scope || 'city:austin-tx,county:travis-county-tx,state:texas';

    console.log('Guest run-update for scope:', resolvedScope);

    // Rate limiting: Check last job for this session
    if (sessionId) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentJobs } = await supabase
        .from('guest_jobs')
        .select('started_at')
        .eq('session_id', sessionId)
        .gte('started_at', fiveMinutesAgo)
        .limit(1);

      if (recentJobs && recentJobs.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please wait 5 minutes between refreshes.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429
          }
        );
      }
    }

    // Get average durations from recent ingest_runs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRuns } = await supabase
      .from('ingest_run')
      .select('started_at, finished_at, source_id')
      .eq('status', 'success')
      .gte('started_at', thirtyDaysAgo)
      .not('finished_at', 'is', null);

    let avgDuration = 120000; // Default 2 minutes
    if (recentRuns && recentRuns.length > 0) {
      const durations = recentRuns
        .map(run => {
          const start = new Date(run.started_at).getTime();
          const end = new Date(run.finished_at!).getTime();
          return end - start;
        })
        .filter(d => d > 0 && d < 600000); // Filter outliers (< 10 min)
      
      if (durations.length > 0) {
        avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      }
    }

    // Get previous lastRunAt for this scope
    const scopeParts = resolvedScope.split(',').map(s => s.split(':')[1]).filter(Boolean);
    const { data: connectors } = await supabase
      .from('connector')
      .select('last_run_at')
      .eq('enabled', true)
      .in('jurisdiction_slug', scopeParts)
      .order('last_run_at', { ascending: false })
      .limit(1);

    const previousLastRunAt = connectors?.[0]?.last_run_at || null;

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('guest_jobs')
      .insert({
        session_id: sessionId,
        scope: resolvedScope,
        status: 'running',
        estimated_duration_ms: Math.round(avgDuration),
        progress_message: 'Updating local data...'
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Start async refresh in background
    supabase.functions.invoke('run-connectors', {
      body: { scope: resolvedScope }
    }).then(async ({ data, error }) => {
      // Update job status
      await supabase
        .from('guest_jobs')
        .update({
          status: error ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          progress_message: error ? 'Update failed' : 'Update complete'
        })
        .eq('id', job.id);
    });

    return new Response(
      JSON.stringify({
        job_id: job.id,
        startedAt: job.started_at,
        previousLastRunAt,
        estimatedDuration: Math.round(avgDuration)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in guest-run-update:', error);
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
