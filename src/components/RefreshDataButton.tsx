import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGuestRunUpdate } from "@/hooks/useGuestRunUpdate";
import { useDataStatus } from "@/hooks/useDataStatus";

interface RefreshDataButtonProps {
  scope?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  sessionId?: string;
  className?: string;
}

export function RefreshDataButton({ scope, variant = "outline", size = "default", sessionId, className }: RefreshDataButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { isGuest } = useAuth();
  const queryClient = useQueryClient();
  const runUpdate = useGuestRunUpdate();
  const { refetch: refetchDataStatus } = useDataStatus(scope || 'city:austin-tx,county:travis-county-tx,state:texas');

  // Poll data status while refreshing
  useEffect(() => {
    if (!isRefreshing || !startTime) return;

    const interval = setInterval(async () => {
      const { data } = await refetchDataStatus();
      
      if (data && data.lastRunAt) {
        const lastRunTime = new Date(data.lastRunAt).getTime();
        if (lastRunTime > startTime) {
          // Data has been updated!
          setIsRefreshing(false);
          setEta(null);
          setStartTime(null);
          
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          queryClient.invalidateQueries({ queryKey: ['legislation'] });
          queryClient.invalidateQueries({ queryKey: ['meetings'] });
          queryClient.invalidateQueries({ queryKey: ['elections'] });
          queryClient.invalidateQueries({ queryKey: ['data-status'] });
          
          toast.success("Updated just now");
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isRefreshing, startTime, refetchDataStatus, queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStartTime(Date.now());
    
    try {
      const result = await runUpdate.mutateAsync({
        scope: scope || 'city:austin-tx,county:travis-county-tx,state:texas',
        sessionId
      });

      setEta(result.estimatedDuration);
      
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      setIsRefreshing(false);
      setEta(null);
      setStartTime(null);
      
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        toast.error("Please wait 5 minutes between refreshes");
      } else {
        toast.error("Failed to start update. Please try again.");
      }
    }
  };

  const formatEta = (ms: number | null) => {
    if (!ms) return "~2m";
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `~${minutes}m`;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className || "gap-2"}
    >
      {isRefreshing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing... {formatEta(eta)} remaining
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </>
      )}
    </Button>
  );
}
