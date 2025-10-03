import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <div className="container max-w-5xl py-6 md:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tracked-terms">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tracked Terms
            </Link>
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">{term.name}</h1>
            <p className="text-muted-foreground">
              Monitoring for: {term.keywords.join(", ")}
            </p>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100">Demo Mode</AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Keyword matching requires saving your tracked terms permanently. Click "Save Permanently" to enable automatic match detection.
            <Button variant="link" className="p-0 h-auto ml-2 text-yellow-900 dark:text-yellow-100">
              Save Permanently
            </Button>
          </AlertDescription>
        </Alert>

        {/* Placeholder */}
        <Card className="p-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Matches will appear here</h3>
            <p className="text-sm text-muted-foreground">
              Save your tracked terms permanently to enable automatic keyword matching across new legislation and meetings
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
