import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function GuestBanner() {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <span className="font-semibold text-foreground">Guest Mode</span>
              <span className="text-muted-foreground ml-2 hidden sm:inline">
                Viewing live Austin data • No signup required
              </span>
            </div>
          </div>
          <Button size="sm" asChild className="bg-primary hover:bg-primary/90 shadow-sm">
            <Link to="/auth?convert=true">
              Save this setup & get alerts
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
