import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CalendarDataStatus {
  hasLiveData: boolean;
  lastRunAt: string | null;
  reason?: string;
  meetingCount: number;
  electionCount: number;
  dataSource: 'live' | 'seed';
}

export function useCalendarDataStatus(jurisdictionIds: string[]): { 
  data?: CalendarDataStatus; 
  isLoading: boolean; 
} {
  return useQuery({
    queryKey: ['calendar-data-status', jurisdictionIds],
    queryFn: async (): Promise<CalendarDataStatus> => {
      if (!jurisdictionIds || jurisdictionIds.length === 0) {
        return {
          hasLiveData: false,
          lastRunAt: null,
          reason: 'No jurisdiction selected',
          meetingCount: 0,
          electionCount: 0,
          dataSource: 'seed',
        };
      }

      // Get jurisdiction slugs from IDs
      const { data: jurisdictions } = await supabase
        .from('jurisdiction')
        .select('slug')
        .in('id', jurisdictionIds);

      const jurisdictionSlugs = jurisdictions?.map(j => j.slug) || [];

      // Check for recent successful ingest runs for meetings or elections
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

      // Get connectors for these jurisdictions (match by slug pattern)
      const { data: connectors } = await supabase
        .from('connector')
        .select('id, last_run_at, last_status, jurisdiction_slug')
        .in('kind', ['meetings', 'elections'])
        .eq('enabled', true);

      // Filter connectors that match our jurisdiction slugs
      const relevantConnectors = connectors?.filter(c => 
        jurisdictionSlugs.some(slug => 
          c.jurisdiction_slug?.includes(slug)
        )
      ) || [];

      let hasRecentRun = false;
      let lastRunAt: string | null = null;

      // Check if any connector has run recently and successfully
      for (const connector of relevantConnectors) {
        if (connector.last_run_at && connector.last_status === 'success') {
          const runDate = new Date(connector.last_run_at);
          if (runDate.toISOString() >= seventyTwoHoursAgo) {
            hasRecentRun = true;
            if (!lastRunAt || runDate > new Date(lastRunAt)) {
              lastRunAt = connector.last_run_at;
            }
          }
        }
      }

      // Count actual data in tables
      const { count: meetingCount } = await supabase
        .from('meeting')
        .select('*', { count: 'exact', head: true })
        .in('jurisdiction_id', jurisdictionIds);

      const { count: electionCount } = await supabase
        .from('election')
        .select('*', { count: 'exact', head: true })
        .in('jurisdiction_id', jurisdictionIds);

      const totalCount = (meetingCount || 0) + (electionCount || 0);
      const hasLiveData = hasRecentRun && totalCount > 0;

      let reason: string | undefined;
      if (!hasLiveData) {
        if (!hasRecentRun) {
          reason = 'No recent connector runs within 72h';
        } else if (totalCount === 0) {
          reason = 'No data in tables';
        }
      }

      return {
        hasLiveData,
        lastRunAt,
        reason,
        meetingCount: meetingCount || 0,
        electionCount: electionCount || 0,
        dataSource: hasLiveData ? 'live' : 'seed',
      };
    },
    enabled: jurisdictionIds.length > 0,
    refetchInterval: 60000, // Refetch every minute
  });
}
