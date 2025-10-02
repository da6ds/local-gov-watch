import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { LegislationTimeline } from "@/components/legislation/LegislationTimeline";
import { PDFViewer } from "@/components/legislation/PDFViewer";
import { QuickActions } from "@/components/legislation/QuickActions";
import { RelatedInfo } from "@/components/legislation/RelatedInfo";
import { Copy, Tag, ArrowLeft, Home } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function LegislationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const { data: topics } = useQuery({
    queryKey: ['legislation-topics', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('item_topic')
        .select('topic, confidence')
        .eq('item_id', id)
        .eq('item_type', 'legislation')
        .order('confidence', { ascending: false });
      return data || [];
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
        <div className="container mx-auto py-8 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!legislation) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Legislation not found</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const summary = legislation.ai_summary || legislation.summary;
  const hasMeaningfulSummary = summary && summary.length > 50;
  const displayTopics = topics && topics.length > 0 
    ? topics.map(t => t.topic) 
    : legislation.tags || [];
  
  const truncateTitle = (title: string, maxLength: number = 50) => {
    return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
  };

  return (
    <Layout>
      <Helmet>
        <title>{legislation.title} - Local Gov Watch</title>
        <meta name="description" content={summary?.slice(0, 160)} />
        <meta property="og:title" content={legislation.title} />
        <meta property="og:description" content={summary?.slice(0, 160)} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="container mx-auto py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/browse/legislation">Legislation</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{truncateTitle(legislation.title)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{legislation.title}</h1>
              
              <div className="flex flex-wrap items-center gap-2">
                {legislation.jurisdiction && (
                  <Badge variant="secondary">
                    {legislation.jurisdiction.name}
                  </Badge>
                )}
                {legislation.status && <StatusBadge status={legislation.status} />}
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
            </div>

            {/* AI Summary - only show if meaningful content exists */}
            {hasMeaningfulSummary && (
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

            {/* Topics */}
            {displayTopics.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Topics
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {displayTopics.map((topic) => (
                      <Link
                        key={topic}
                        to={`/browse/legislation?topic=${encodeURIComponent(topic)}`}
                      >
                        <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                          {topic}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PDF Viewer */}
            <PDFViewer
              pdfUrl={legislation.pdf_url}
              extractedText={legislation.full_text}
              docUrl={legislation.doc_url}
              title={legislation.title}
            />

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

          {/* RIGHT SIDEBAR (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            <LegislationTimeline
              currentStatus={legislation.status || 'introduced'}
              introducedAt={legislation.introduced_at}
              passedAt={legislation.passed_at}
              effectiveAt={legislation.effective_at}
            />

            <QuickActions legislationId={id!} legislationTitle={legislation.title} />

            <RelatedInfo
              jurisdiction={legislation.jurisdiction}
              externalId={legislation.external_id}
              sourceUrl={legislation.source_url}
              docUrl={legislation.doc_url}
              people={legislation.people}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
