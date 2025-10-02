import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RefreshDataButtonProps {
  scope?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function RefreshDataButton({ scope, variant = "outline", size = "default" }: RefreshDataButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const { isGuest } = useAuth();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setProgress("Running connectors...");
    
    try {
      // Check rate limit for guests
      if (isGuest) {
        const lastRefresh = localStorage.getItem('last_refresh_time');
        if (lastRefresh) {
          const timeSince = Date.now() - parseInt(lastRefresh);
          const fiveMinutes = 5 * 60 * 1000;
          if (timeSince < fiveMinutes) {
            const waitTime = Math.ceil((fiveMinutes - timeSince) / 1000 / 60);
            toast.error(`Please wait ${waitTime} minute(s) before refreshing again`);
            setIsRefreshing(false);
            setProgress("");
            return;
          }
        }
        localStorage.setItem('last_refresh_time', Date.now().toString());
      }

      // Call edge function to run connectors
      const { data, error } = await supabase.functions.invoke('run-connectors', {
        body: { scope: scope || 'city:austin-tx' }
      });

      if (error) throw error;

      setProgress("Connectors completed. Refreshing data...");

      // Wait a moment for data to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Invalidate all queries to force refetch
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['legislation'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      queryClient.invalidateQueries({ queryKey: ['live-data-status'] });

      toast.success(`Data refreshed! ${data?.summary || ''}`);
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      
      if (error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please wait a few minutes.");
      } else {
        toast.error("Failed to refresh data. Please try again.");
      }
    } finally {
      setIsRefreshing(false);
      setProgress("");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      {isRefreshing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {progress || "Refreshing..."}
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
