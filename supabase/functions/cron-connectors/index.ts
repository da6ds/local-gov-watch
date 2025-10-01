import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all enabled connectors
    const { data: connectors, error } = await supabase
      .from("connector")
      .select("*")
      .eq("enabled", true);

    if (error) throw error;

    console.log(`Found ${connectors?.length || 0} enabled connectors`);

    const results = [];

    for (const connector of connectors || []) {
      try {
        // Call run-connector function for each enabled connector
        const { data, error: runError } = await supabase.functions.invoke(
          "run-connector",
          {
            body: { connectorId: connector.id },
          }
        );

        if (runError) {
          console.error(`Error running ${connector.key}:`, runError);
          results.push({ key: connector.key, status: "error", error: runError.message });
        } else {
          console.log(`Successfully ran ${connector.key}`);
          results.push({ key: connector.key, status: "success", data });
        }
      } catch (error) {
        console.error(`Exception running ${connector.key}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ key: connector.key, status: "error", error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${connectors?.length || 0} connectors`,
        results,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cron job error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
