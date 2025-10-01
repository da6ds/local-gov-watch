import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function GuestBanner() {
  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">You're in Guest Mode</span>
            <span className="text-muted-foreground hidden sm:inline">
              • Create an account to save your setup and receive alerts
            </span>
          </div>
          <Button size="sm" asChild>
            <Link to="/auth?convert=true">Save this setup</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
