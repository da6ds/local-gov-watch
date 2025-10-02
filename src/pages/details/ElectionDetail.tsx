import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ElectionDetail() {
  const { id } = useParams();

  const { data: election, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('election')
        .select(`
          *,
          jurisdiction:jurisdiction_id (name, slug, type)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!election) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Election not found</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const results = election.results_json as Record<string, any> | null;
  const isPastElection = election.date && new Date(election.date) < new Date();

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{election.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {election.jurisdiction && (
                <Badge variant="secondary">
                  {election.jurisdiction.name}
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {election.kind}
              </Badge>
              {!isPastElection && (
                <Badge variant="default">Upcoming</Badge>
              )}
            </div>
          </div>

          {/* Election Details */}
          <div className="space-y-2 text-sm">
            {election.date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Election Date:</span>
                <span>{format(new Date(election.date), "PPPP")}</span>
              </div>
            )}
            {election.registration_deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Registration Deadline:</span>
                <span>{format(new Date(election.registration_deadline), "PPPP")}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {election.info_url && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={election.info_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Official Information
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        {results && Object.keys(results).length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Election Results</h2>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Important Dates */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Important Dates</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {election.registration_deadline && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="font-medium">Voter Registration Deadline</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(election.registration_deadline), "PPP")}
                </span>
              </div>
            )}
            {election.date && (
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">Election Day</span>
                <span className="text-sm">
                  {format(new Date(election.date), "PPP")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Metadata</h2>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            {election.updated_at && (
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {format(new Date(election.updated_at), "PPP")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
