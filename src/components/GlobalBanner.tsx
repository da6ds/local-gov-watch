import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Sparkles } from "lucide-react";
import { clearGuestSession } from "@/lib/guestSession";
import { clearGuestScope, clearGuestTopics } from "@/lib/guestSessionStorage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRef, useEffect } from "react";

let bannerMounted = false;

interface GlobalBannerProps {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
}

export function GlobalBanner({ demoMode, setDemoMode }: GlobalBannerProps) {
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

  const handleReset = () => {
    sessionStorage.removeItem('hasSeenOnboarding');
    sessionStorage.removeItem('hasSeenWalkthrough');
    clearGuestSession();
    clearGuestScope();
    clearGuestTopics();
    queryClient.clear();
    setDemoMode(false);
    toast.success("Demo reset");
    navigate("/");
  };

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 py-1.5">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <Button
          variant={demoMode ? "default" : "outline"}
          size="sm"
          onClick={() => setDemoMode(!demoMode)}
          className="h-7 text-xs gap-1.5"
        >
          <Sparkles className="h-3 w-3" />
          {demoMode ? "Demo: ON" : "Demo: OFF"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 text-xs gap-1.5"
        >
          <RefreshCw className="h-3 w-3" />
          Reset
        </Button>
      </div>
    </div>
  );
}
