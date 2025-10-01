import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConnectorStats {
  newCount: number;
  updatedCount: number;
  errorCount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { connectorId } = await req.json();

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
    
    // Create ingest run
    const { data: ingestRun, error: runError } = await supabase
      .from("ingest_run")
      .insert({
        status: "running",
        log: `Starting ${connector.key}`,
      })
      .select()
      .single();

    if (runError) throw runError;

    let stats: ConnectorStats = { newCount: 0, updatedCount: 0, errorCount: 0 };
    let status = "success";
    let log = "";

    try {
      // Run the appropriate parser based on parser_key
      stats = await runParser(supabase, connector, jurisdictionId);
      log = `Completed: ${stats.newCount} new, ${stats.updatedCount} updated, ${stats.errorCount} errors`;
    } catch (error) {
      status = "error";
      const errorMessage = error instanceof Error ? error.message : String(error);
      log = `Error: ${errorMessage}`;
      console.error("Parser error:", error);
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
    console.error("Error running connector:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
  supabase: any,
  connector: any,
  jurisdictionId: string
): Promise<ConnectorStats> {
  // This is a stub - actual parser implementations would go here
  // For now, just return mock stats
  console.log(`Parser ${connector.parser_key} would run for ${connector.url}`);
  
  // Simulate processing based on parser type
  if (connector.parser_key === "austin_council_meetings") {
    return await mockAustinMeetings(supabase, jurisdictionId);
  } else if (connector.parser_key === "austin_ordinances") {
    return await mockAustinOrdinances(supabase, jurisdictionId);
  } else if (connector.parser_key === "travis_elections") {
    return await mockTravisElections(supabase, jurisdictionId);
  }

  return { newCount: 0, updatedCount: 0, errorCount: 0 };
}

async function mockAustinMeetings(supabase: any, jurisdictionId: string): Promise<ConnectorStats> {
  // This would actually scrape and parse, but for now just log
  console.log("Would scrape Austin council meetings");
  return { newCount: 0, updatedCount: 0, errorCount: 0 };
}

async function mockAustinOrdinances(supabase: any, jurisdictionId: string): Promise<ConnectorStats> {
  console.log("Would scrape Austin ordinances");
  return { newCount: 0, updatedCount: 0, errorCount: 0 };
}

async function mockTravisElections(supabase: any, jurisdictionId: string): Promise<ConnectorStats> {
  console.log("Would scrape Travis County elections");
  return { newCount: 0, updatedCount: 0, errorCount: 0 };
}
