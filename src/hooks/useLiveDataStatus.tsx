import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LiveDataStatus {
  hasLiveData: boolean;
  lastRunAt: string | null;
  reason?: string;
  dataSource: 'live' | 'seed';
}

export function useLiveDataStatus(jurisdictionSlugs: string[]): {
  data?: LiveDataStatus;
  isLoading: boolean;
} {
  return useQuery({
    queryKey: ['live-data-status', ...jurisdictionSlugs],
    queryFn: async (): Promise<LiveDataStatus> => {
      if (jurisdictionSlugs.length === 0) {
        return { 
          hasLiveData: false, 
          lastRunAt: null, 
          reason: 'No jurisdiction specified',
          dataSource: 'seed'
        };
      }
      
      // Check connectors for all jurisdiction levels (city, county, state)
      const { data: connectors } = await supabase
        .from('connector')
        .select('last_run_at, last_status, jurisdiction_slug, kind')
        .in('jurisdiction_slug', jurisdictionSlugs)
        .eq('enabled', true)
        .eq('last_status', 'success')
        .order('last_run_at', { ascending: false });
      
      if (!connectors || connectors.length === 0) {
        return { 
          hasLiveData: false, 
          lastRunAt: null, 
          reason: 'No successful connector runs found',
          dataSource: 'seed'
        };
      }
      
      // Check if any connector ran within 72 hours
      const now = new Date();
      const recentConnectors = connectors.filter(c => {
        if (!c.last_run_at) return false;
        const lastRunDate = new Date(c.last_run_at);
        const hoursSinceRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);
        return hoursSinceRun <= 72;
      });
      
      if (recentConnectors.length === 0) {
        return {
          hasLiveData: false,
          lastRunAt: connectors[0]?.last_run_at || null,
          reason: 'Last connector run was more than 72 hours ago',
          dataSource: 'seed'
        };
      }
      
      // Check if we actually have data in the tables
      const [legislationCount, meetingCount, electionCount] = await Promise.all([
        supabase
          .from('legislation')
          .select('id', { count: 'exact', head: true })
          .limit(1),
        supabase
          .from('meeting')
          .select('id', { count: 'exact', head: true })
          .limit(1),
        supabase
          .from('election')
          .select('id', { count: 'exact', head: true })
          .limit(1)
      ]);
      
      const totalRows = (legislationCount.count || 0) + (meetingCount.count || 0) + (electionCount.count || 0);
      
      if (totalRows === 0) {
        return {
          hasLiveData: false,
          lastRunAt: recentConnectors[0].last_run_at,
          reason: 'Connectors ran successfully but no data in tables',
          dataSource: 'seed'
        };
      }
      
      return { 
        hasLiveData: true, 
        lastRunAt: recentConnectors[0].last_run_at,
        dataSource: 'live'
      };
    },
    enabled: jurisdictionSlugs.length > 0,
    refetchInterval: 60000 // Refetch every minute
  });
}
