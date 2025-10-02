import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, RotateCcw } from "lucide-react";
import { clearGuestSession } from "@/lib/guestSession";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function GuestBanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRestartDemo = () => {
    clearGuestSession();
    queryClient.clear();
    toast.success("Demo restarted");
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <span className="font-semibold text-foreground">Guest Demo</span>
              <span className="text-muted-foreground ml-2 hidden sm:inline">
                Changes aren't saved • Viewing Austin & Travis County
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleRestartDemo}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Restart demo</span>
            </Button>
            <Button size="sm" asChild className="bg-primary hover:bg-primary/90 shadow-sm">
              <Link to="/auth?convert=true">
                Save this setup
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
