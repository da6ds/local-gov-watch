import { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataStatus } from "@/hooks/useDataStatus";
import { useGuestRunUpdate } from "@/hooks/useGuestRunUpdate";
import { useQueryClient } from "@tanstack/react-query";
import { getGuestScope } from "@/lib/guestSessionStorage";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface RefreshControlProps {
  scope?: string;
}

export function RefreshControl({ scope: propScope }: RefreshControlProps) {
  const queryClient = useQueryClient();
  const scopeString = propScope || getGuestScope().join(',');
  const { data: dataStatus } = useDataStatus(scopeString);
  const guestRunUpdate = useGuestRunUpdate();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const startingLastRunAt = useRef<string | null>(null);

  // Poll for completion
  useEffect(() => {
    if (!isRefreshing || !startingLastRunAt.current) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['data-status'] });

      // Check if lastRunAt has changed
      if (dataStatus?.lastRunAt && dataStatus.lastRunAt !== startingLastRunAt.current) {
        setIsRefreshing(false);
        setStartTime(null);
        startingLastRunAt.current = null;
        
        toast.success("Updated just now");
        
        // Invalidate all data queries
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
        queryClient.invalidateQueries({ queryKey: ['legislation'] });
        queryClient.invalidateQueries({ queryKey: ['meetings-upcoming'] });
        queryClient.invalidateQueries({ queryKey: ['meetings-past'] });
        queryClient.invalidateQueries({ queryKey: ['elections'] });
        queryClient.invalidateQueries({ queryKey: ['trends'] });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isRefreshing, dataStatus?.lastRunAt, queryClient]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setStartTime(new Date());
      startingLastRunAt.current = dataStatus?.lastRunAt || null;

      await guestRunUpdate.mutateAsync({
        scope: scopeString,
      });
    } catch (error: any) {
      console.error('Refresh error:', error);
      setIsRefreshing(false);
      setStartTime(null);
      startingLastRunAt.current = null;
      
      if (error.message?.includes('rate limit')) {
        toast.error("Please wait before refreshing again");
      } else {
        toast.error("Failed to refresh data");
      }
    }
  };

  const getTimestamp = () => {
    if (!dataStatus?.lastRunAt) return null;
    
    try {
      const lastRun = new Date(dataStatus.lastRunAt);
      return `Live as of ${formatDistanceToNow(lastRun, { addSuffix: true })}`;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {!isRefreshing && getTimestamp() && (
        <span
          className="text-xs text-muted-foreground"
          aria-live="polite"
        >
          {getTimestamp()}
        </span>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  );
}
