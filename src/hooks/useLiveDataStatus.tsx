import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLiveDataStatus(jurisdictionSlug?: string) {
  return useQuery({
    queryKey: ['live-data-status', jurisdictionSlug],
    queryFn: async () => {
      if (!jurisdictionSlug) return { hasLiveData: false, lastRunAt: null };
      
      const { data: connectors } = await supabase
        .from('connector')
        .select('last_run_at, last_status')
        .eq('jurisdiction_slug', jurisdictionSlug)
        .eq('enabled', true)
        .order('last_run_at', { ascending: false })
        .limit(1);
      
      if (!connectors || connectors.length === 0) {
        return { hasLiveData: false, lastRunAt: null };
      }
      
      const lastRun = connectors[0];
      if (!lastRun.last_run_at) {
        return { hasLiveData: false, lastRunAt: null };
      }
      
      // Check if within 72 hours
      const lastRunDate = new Date(lastRun.last_run_at);
      const now = new Date();
      const hoursSinceRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);
      const hasLiveData = hoursSinceRun <= 72 && lastRun.last_status === 'success';
      
      return { hasLiveData, lastRunAt: lastRun.last_run_at };
    },
    enabled: !!jurisdictionSlug
  });
}
