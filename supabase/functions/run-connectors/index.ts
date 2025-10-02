import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectorRunRequest {
  scope?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { scope } = await req.json() as ConnectorRunRequest;
    
    console.log('Running connectors for scope:', scope);

    // Parse scope to determine which jurisdictions to run
    const scopeParts = scope?.split(',') || ['city:austin-tx'];
    const jurisdictionSlugs: string[] = [];

    for (const part of scopeParts) {
      const [type, slug] = part.split(':');
      if (slug) {
        jurisdictionSlugs.push(slug);
      }
    }

    console.log('Jurisdiction slugs:', jurisdictionSlugs);

    // Get all enabled connectors for these jurisdictions
    const { data: connectors, error: connectorsError } = await supabase
      .from('connector')
      .select('id, name, jurisdiction_slug, kind')
      .eq('enabled', true)
      .in('kind', ['meetings', 'elections', 'ordinances']);

    if (connectorsError) {
      throw new Error(`Failed to fetch connectors: ${connectorsError.message}`);
    }

    console.log(`Found ${connectors?.length || 0} enabled connectors`);

    // Filter connectors that match our scope
    const matchingConnectors = connectors?.filter(c => {
      const connectorSlug = c.jurisdiction_slug?.split(':')[1];
      return connectorSlug && jurisdictionSlugs.includes(connectorSlug);
    }) || [];

    console.log(`Running ${matchingConnectors.length} matching connectors`);

    // Run each connector
    const results = [];
    for (const connector of matchingConnectors) {
      console.log(`Running connector: ${connector.name} (${connector.id})`);
      
      try {
        // Call the run-connector edge function for each connector
        const { data: runResult, error: runError } = await supabase.functions.invoke(
          'run-connector',
          {
            body: { connectorId: connector.id }
          }
        );

        if (runError) {
          console.error(`Error running connector ${connector.name}:`, runError);
          results.push({
            connector: connector.name,
            status: 'error',
            error: runError.message
          });
        } else {
          console.log(`Connector ${connector.name} completed:`, runResult);
          results.push({
            connector: connector.name,
            status: 'success',
            stats: runResult
          });
        }
      } catch (error) {
        console.error(`Exception running connector ${connector.name}:`, error);
        results.push({
          connector: connector.name,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Brief delay between connectors to avoid overwhelming external sites
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Count successes
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    const summary = `${successCount} succeeded, ${errorCount} failed`;

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        connectors_run: matchingConnectors.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in run-connectors:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
