import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DataStatus {
  mode: 'live' | 'seed';
  reason: 'no-successful-runs' | 'tables-empty' | 'success-but-empty-window' | 'ok';
  lastRunAt: string | null;
  tableCounts: {
    meetings: number;
    legislation: number;
    elections: number;
  };
  avgDurations: {
    meetings: number;
    legislation: number;
    elections: number;
  };
  totalEstimate: number;
  scopeUsed: string;
  diagnostics: {
    enabledConnectors: number;
    recentRuns: number;
    jurisdictionSlugs: string[];
  };
}

export function useDataStatus(scope: string) {
  return useQuery({
    queryKey: ['data-status', scope],
    queryFn: async (): Promise<DataStatus> => {
      // Call the edge function with GET request (query params)
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-status`);
      url.searchParams.set('scope', scope);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      });

      if (!response.ok) {
        console.error('Error fetching data status:', await response.text());
        // Return degraded fallback
        return {
          mode: 'seed',
          reason: 'no-successful-runs',
          lastRunAt: null,
          tableCounts: { meetings: 0, legislation: 0, elections: 0 },
          avgDurations: { meetings: 0, legislation: 0, elections: 0 },
          totalEstimate: 0,
          scopeUsed: scope,
          diagnostics: {
            enabledConnectors: 0,
            recentRuns: 0,
            jurisdictionSlugs: []
          }
        };
      }

      return await response.json();
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  });
}
