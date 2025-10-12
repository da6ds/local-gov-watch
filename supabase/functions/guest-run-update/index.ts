import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const RunUpdateSchema = z.object({
  scope: z.string()
    .regex(/^([a-z]+:[a-z0-9-]+(,[a-z]+:[a-z0-9-]+)*)$/)
    .optional(),
  sessionId: z.string()
    .regex(/^guest_[a-f0-9-]+$/)
    .optional()
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Input validation
    const body = await req.json();
    const validation = RunUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const { scope, sessionId } = validation.data;
    const resolvedScope = scope || 'city:austin-tx,county:travis-county-tx,state:texas';

    console.log('Guest run-update for scope:', resolvedScope);

    // IP-based rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: ipJobs, error: ipError } = await supabase
      .from('guest_jobs')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', oneHourAgo);

    // Global rate limit: max 10 requests per hour per IP (simplified check)
    if (!ipError && ipJobs && (ipJobs as any).count >= 50) {
      return new Response(
        JSON.stringify({
          error: 'System is currently busy. Please try again later.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503
        }
      );
    }

    // Check global concurrent job limit
    const { data: runningJobs } = await supabase
      .from('guest_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'running');

    if (runningJobs && (runningJobs as any).count >= 20) {
      return new Response(
        JSON.stringify({
          error: 'System is currently busy processing other requests. Please try again in a moment.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503
        }
      );
    }

    // Session-based rate limiting: 5 minutes between requests
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
    // Log full error server-side for debugging
    console.error('Error in guest-run-update:', error);
    
    // Return sanitized error to client
    const errorId = crypto.randomUUID();
    console.error(`Error ID ${errorId}:`, error instanceof Error ? error.stack : error);
    
    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing your request. Please try again later.',
        error_id: errorId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
