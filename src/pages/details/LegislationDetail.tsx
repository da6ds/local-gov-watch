import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentPreview } from "@/components/DocumentPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, Copy, Tag } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LegislationDetail() {
  const { id } = useParams();

  const { data: legislation, isLoading } = useQuery({
    queryKey: ['legislation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legislation')
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

  const { data: relatedMeetings } = useQuery({
    queryKey: ['related-meetings', legislation?.tags],
    queryFn: async () => {
      if (!legislation?.tags || legislation.tags.length === 0) return [];
      
      const startDate = legislation.introduced_at 
        ? new Date(new Date(legislation.introduced_at).getTime() - 14 * 24 * 60 * 60 * 1000)
        : null;
      const endDate = legislation.introduced_at
        ? new Date(new Date(legislation.introduced_at).getTime() + 14 * 24 * 60 * 60 * 1000)
        : null;

      let query = supabase
        .from('meeting')
        .select('*')
        .limit(5);

      if (startDate && endDate) {
        query = query
          .gte('starts_at', startDate.toISOString())
          .lte('starts_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!legislation
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

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

  if (!legislation) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Legislation not found</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const summary = legislation.ai_summary || legislation.summary || legislation.full_text?.slice(0, 400);

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h1 className="text-3xl font-bold">{legislation.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {legislation.jurisdiction && (
                  <Badge variant="secondary">
                    {legislation.jurisdiction.name}
                  </Badge>
                )}
                {legislation.status && <StatusBadge status={legislation.status} />}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {legislation.introduced_at && (
              <div>
                <span className="font-medium">Introduced:</span>{" "}
                {format(new Date(legislation.introduced_at), "PPP")}
              </div>
            )}
            {legislation.passed_at && (
              <div>
                <span className="font-medium">Passed:</span>{" "}
                {format(new Date(legislation.passed_at), "PPP")}
              </div>
            )}
            {legislation.effective_at && (
              <div>
                <span className="font-medium">Effective:</span>{" "}
                {format(new Date(legislation.effective_at), "PPP")}
              </div>
            )}
          </div>

          {/* Sticky Actions */}
          <div className="flex flex-wrap gap-2 sticky top-4 z-10 bg-background/95 backdrop-blur p-2 -mx-2 rounded-lg border">
            {legislation.doc_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={legislation.doc_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Source
                </a>
              </Button>
            )}
            {legislation.pdf_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={legislation.pdf_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Open PDF
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {summary && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {legislation.ai_summary ? "AI Summary" : "Summary"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(summary)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {legislation.tags && legislation.tags.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Topics
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {legislation.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/browse/legislation?tag=${encodeURIComponent(tag)}`}
                  >
                    <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Text */}
        {legislation.full_text && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Full Text</h2>
            </CardHeader>
            <CardContent>
              <DocumentPreview text={legislation.full_text} />
            </CardContent>
          </Card>
        )}

        {/* Related Meetings */}
        {relatedMeetings && relatedMeetings.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Related Meetings</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {relatedMeetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{meeting.title}</div>
                    {meeting.starts_at && (
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(meeting.starts_at), "PPP")}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Metadata</h2>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            {legislation.external_id && (
              <div>
                <span className="font-medium">External ID:</span> {legislation.external_id}
              </div>
            )}
            {legislation.updated_at && (
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {format(new Date(legislation.updated_at), "PPP")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
