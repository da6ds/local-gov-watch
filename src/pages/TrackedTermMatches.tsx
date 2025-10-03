import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { getTrackedTerm } from "@/lib/trackedTermStorage";

export default function TrackedTermMatches() {
  const { id } = useParams();

  const { data: term } = useQuery({
    queryKey: ['tracked-term-session', id],
    queryFn: () => id ? getTrackedTerm(id) : null,
    enabled: !!id,
  });

  if (!term) return null;

  return (
    <Layout>
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tracked-terms">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tracked Terms
            </Link>
          </Button>

          <div className="space-y-1">
            <h1 className="text-xl font-bold">{term.name}</h1>
            <p className="text-xs text-muted-foreground">
              Monitoring for: {term.keywords.join(", ")}
            </p>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          Demo Mode - Keyword matching requires backend integration
        </div>

        {/* Placeholder */}
        <Card className="p-8 text-center">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Matches will appear here</h3>
            <p className="text-sm text-muted-foreground">
              Automatic keyword matching across new legislation and meetings
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
