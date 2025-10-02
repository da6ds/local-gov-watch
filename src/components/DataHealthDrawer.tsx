import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface DataHealthDrawerProps {
  jurisdictionSlugs: string[];
}

export function DataHealthDrawer({ jurisdictionSlugs }: DataHealthDrawerProps) {
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['data-health', ...jurisdictionSlugs],
    queryFn: async () => {
      // Get connector stats
      const { data: connectors } = await supabase
        .from('connector')
        .select('*')
        .in('jurisdiction_slug', jurisdictionSlugs)
        .order('last_run_at', { ascending: false });

      // Get table counts
      const [legCount, meetingCount, electionCount] = await Promise.all([
        supabase.from('legislation').select('id', { count: 'exact', head: true }),
        supabase.from('meeting').select('id', { count: 'exact', head: true }),
        supabase.from('election').select('id', { count: 'exact', head: true })
      ]);

      return {
        connectors: connectors || [],
        counts: {
          legislation: legCount.count || 0,
          meetings: meetingCount.count || 0,
          elections: electionCount.count || 0
        }
      };
    },
    enabled: jurisdictionSlugs.length > 0
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Activity className="h-4 w-4" />
          Data Health
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Data Health Diagnostics</SheetTitle>
          <SheetDescription>
            View data counts and connector status for your jurisdictions
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Table Counts */}
          <div>
            <h3 className="font-semibold mb-3">Data Counts</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-2xl font-bold">{healthData?.counts.legislation || 0}</div>
                <div className="text-xs text-muted-foreground">Legislation</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-2xl font-bold">{healthData?.counts.meetings || 0}</div>
                <div className="text-xs text-muted-foreground">Meetings</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-2xl font-bold">{healthData?.counts.elections || 0}</div>
                <div className="text-xs text-muted-foreground">Elections</div>
              </div>
            </div>
          </div>

          {/* Connector Status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Connector Status</h3>
              <Button size="sm" variant="ghost" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {healthData?.connectors.map((connector) => (
                <div key={connector.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">{connector.key}</div>
                      <div className="text-xs text-muted-foreground">{connector.jurisdiction_slug}</div>
                    </div>
                    <Badge variant={connector.last_status === 'success' ? 'default' : 'destructive'}>
                      {connector.last_status || 'never run'}
                    </Badge>
                  </div>
                  {connector.last_run_at && (
                    <div className="text-xs text-muted-foreground">
                      Last run: {format(new Date(connector.last_run_at), 'PPpp')}
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="text-muted-foreground">Kind:</span> {connector.kind}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
