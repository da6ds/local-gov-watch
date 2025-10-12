import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const RunConnectorSchema = z.object({
  connectorId: z.string().uuid()
});

interface ConnectorStats {
  newCount: number;
  updatedCount: number;
  errorCount: number;
  errors?: string[];
  firstError?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Input validation
    const body = await req.json();
    const validation = RunConnectorSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid connector ID format' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { connectorId } = validation.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get connector details
    const { data: connector, error: connectorError } = await supabase
      .from("connector")
      .select("*")
      .eq("id", connectorId)
      .single();

    if (connectorError || !connector) {
      throw new Error("Connector not found");
    }

    if (!connector.enabled) {
      throw new Error("Connector is disabled");
    }

    console.log(`Running connector: ${connector.key}`);

    // Get jurisdiction
    const jurisdictionId = await getJurisdictionId(supabase, connector.jurisdiction_slug);
    
    // Get or create source record
    let sourceId = connector.source_id;
    if (!sourceId) {
      const { data: source, error: sourceError } = await supabase
        .from("source")
        .insert({
          jurisdiction_id: jurisdictionId,
          kind: connector.kind,
          url: connector.url,
          connector_id: connector.id,
        })
        .select()
        .single();
      
      if (sourceError) throw sourceError;
      sourceId = source.id;
      
      // Update connector with source_id
      await supabase
        .from("connector")
        .update({ source_id: sourceId })
        .eq("id", connector.id);
    }
    
    // Create ingest run
    const { data: ingestRun, error: runError } = await supabase
      .from("ingest_run")
      .insert({
        source_id: sourceId,
        status: "running",
        log: `Starting ${connector.key}`,
      })
      .select()
      .single();

    if (runError) throw runError;

    let stats: ConnectorStats = { newCount: 0, updatedCount: 0, errorCount: 0, errors: [] };
    let status = "success";
    let log = "";

    try {
      // Run the appropriate parser based on parser_key
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      stats = await runParser(connector, supabaseUrl, supabaseKey, sourceId, jurisdictionId);
      
      // Enhanced logging with first error
      const errorSummary = stats.errorCount > 0 && stats.errors && stats.errors.length > 0 
        ? ` | First error: ${stats.errors[0]}` 
        : '';
      log = `Completed: ${stats.newCount} new, ${stats.updatedCount} updated, ${stats.errorCount} errors${errorSummary}`;
      
      if (stats.errorCount > 0 && stats.errors && stats.errors.length > 0) {
        stats.firstError = stats.errors[0];
      }
    } catch (error) {
      status = "error";
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      log = `Error: ${errorMessage}`;
      console.error("Parser error:", error);
      console.error("Stack trace:", stackTrace);
      
      if (stats.errors) {
        stats.firstError = errorMessage;
        stats.errors.push(errorMessage);
      }
    }

    // Update connector status
    await supabase
      .from("connector")
      .update({
        last_run_at: new Date().toISOString(),
        last_status: status,
      })
      .eq("id", connectorId);

    // Update ingest run
    await supabase
      .from("ingest_run")
      .update({
        status,
        log,
        stats_json: stats,
        finished_at: new Date().toISOString(),
      })
      .eq("id", ingestRun.id);

    return new Response(
      JSON.stringify({ success: true, stats, status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Log full error server-side for debugging
    console.error("Error running connector:", error);
    
    // Return sanitized error to client
    const errorId = crypto.randomUUID();
    console.error(`Error ID ${errorId}:`, error instanceof Error ? error.stack : error);
    
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while running the connector. Please contact support if this persists.',
        error_id: errorId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getJurisdictionId(supabase: any, slug: string): Promise<string> {
  const { data, error } = await supabase
    .from("jurisdiction")
    .select("id")
    .eq("slug", slug.split(":")[1])
    .single();

  if (error || !data) {
    throw new Error(`Jurisdiction not found: ${slug}`);
  }

  return data.id;
}

async function runParser(
  connector: any,
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string
): Promise<ConnectorStats> {
  console.log(`Running parser: ${connector.parser_key}`);
  
  // Import shared helpers
  const { createIngestStats } = await import('../_shared/helpers.ts');
  const stats = createIngestStats();
  
  // Route to appropriate parser based on parser_key
  switch (connector.parser_key) {
    case 'austin.councilMeetings': {
      const { parseAustinMeetings } = await import('../_shared/parsers/austinMeetings.ts');
      await parseAustinMeetings(supabaseUrl, supabaseKey, sourceId, jurisdictionId, stats);
      break;
    }
    case 'austin.ordinances': {
      const { parseAustinOrdinances } = await import('../_shared/parsers/austinOrdinances.ts');
      await parseAustinOrdinances(supabaseUrl, supabaseKey, sourceId, jurisdictionId, stats);
      break;
    }
    case 'travis.elections': {
      const { parseTravisElections } = await import('../_shared/parsers/travisElections.ts');
      await parseTravisElections(supabaseUrl, supabaseKey, sourceId, jurisdictionId, stats);
      break;
    }
    case 'texas.bills': {
      const { parseTexasBills } = await import('../_shared/parsers/texasBills.ts');
      await parseTexasBills(supabaseUrl, supabaseKey, sourceId, jurisdictionId, stats);
      break;
    }
    default:
      throw new Error(`Unknown parser: ${connector.parser_key}`);
  }
  
  return {
    newCount: stats.newCount,
    updatedCount: stats.updatedCount,
    errorCount: stats.errorCount,
    errors: stats.errors,
    firstError: stats.firstError,
  };
}
