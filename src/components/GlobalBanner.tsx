import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, RotateCcw } from "lucide-react";
import { clearGuestSession } from "@/lib/guestSession";
import { clearGuestScope, clearGuestTopics } from "@/lib/guestSessionStorage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshDataButton } from "./RefreshDataButton";
import { useRef, useEffect } from "react";

let bannerMounted = false;

export function GlobalBanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mountedRef = useRef(false);

  // Singleton guard - prevent duplicate instances
  useEffect(() => {
    if (bannerMounted) {
      console.warn("GlobalBanner: duplicate instance detected, skipping mount");
      return;
    }
    bannerMounted = true;
    mountedRef.current = true;

    return () => {
      bannerMounted = false;
      mountedRef.current = false;
    };
  }, []);

  // Don't render if already mounted elsewhere
  if (!mountedRef.current && bannerMounted) {
    return null;
  }

  const handleRestartDemo = () => {
    clearGuestSession();
    clearGuestScope();
    clearGuestTopics();
    queryClient.clear();
    toast.success("Demo restarted");
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Guest Demo</span>
            <span className="text-muted-foreground hidden sm:inline">
              — changes aren't saved
            </span>
          </div>
          <div className="flex gap-2">
            <RefreshDataButton 
              variant="ghost" 
              size="sm"
              className="h-8"
            />
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleRestartDemo}
              className="h-8 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restart</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
