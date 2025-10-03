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
import { Copy, Tag, ArrowLeft, Home, ChevronDown, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
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
  
  // Collapsible section states
  const [topicsOpen, setTopicsOpen] = useState(true);
  const [documentOpen, setDocumentOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);

  const { data: legislation, isLoading } = useQuery({
    queryKey: ['legislation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legislation')
        .select(`
          *,
          jurisdiction:jurisdiction_id (name, slug, type, website, phone, email)
        `)
        .eq('id', id)
        .maybeSingle();
      
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

      <div className="container mx-auto py-3 md:py-8 pb-32 md:pb-8">
        {/* Back Button - Desktop only */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="hidden md:flex mb-4 h-9"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Breadcrumbs - Desktop only */}
        <div className="hidden md:block mb-6">
          <Breadcrumb>
            <BreadcrumbList className="text-sm">
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

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          {/* Header - Always Visible */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold leading-tight">{legislation.title}</h1>
            
            <div className="flex flex-wrap items-center gap-1.5">
              {legislation.jurisdiction && (
                <Badge variant="secondary" className="text-xs py-0.5 px-2">
                  {legislation.jurisdiction.name}
                </Badge>
              )}
              {legislation.status && <StatusBadge status={legislation.status} />}
            </div>

            {/* Dates */}
            {(legislation.introduced_at || legislation.passed_at || legislation.effective_at) && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {legislation.introduced_at && (
                  <div>
                    <span className="font-medium">Introduced:</span>{" "}
                    {format(new Date(legislation.introduced_at), "MMM d, yyyy")}
                  </div>
                )}
                {legislation.passed_at && (
                  <div>
                    <span className="font-medium">Passed:</span>{" "}
                    {format(new Date(legislation.passed_at), "MMM d, yyyy")}
                  </div>
                )}
                {legislation.effective_at && (
                  <div>
                    <span className="font-medium">Effective:</span>{" "}
                    {format(new Date(legislation.effective_at), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Summary - only show if meaningful */}
          {hasMeaningfulSummary && (
            <Card className="p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">
                    {legislation.ai_summary ? "AI Summary" : "Summary"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(summary)}
                    className="h-7 w-7 p-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">{summary}</p>
              </div>
            </Card>
          )}

          {/* Topics - Collapsible */}
          {displayTopics.length > 0 && (
            <Collapsible open={topicsOpen} onOpenChange={setTopicsOpen}>
              <Card className="p-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Topics
                  </h2>
                  <ChevronDown className={`h-4 w-4 transition-transform ${topicsOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {displayTopics.map((topic) => (
                      <Link
                        key={topic}
                        to={`/browse/legislation?topic=${encodeURIComponent(topic)}`}
                      >
                        <Badge variant="secondary" className="text-xs py-1 px-2 hover:bg-secondary/80 cursor-pointer">
                          {topic}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Full Document - Collapsible (Expanded by default) */}
          <Collapsible open={documentOpen} onOpenChange={setDocumentOpen}>
            <Card className="p-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className="text-base font-semibold">Full Document</h2>
                <ChevronDown className={`h-4 w-4 transition-transform ${documentOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <PDFViewer
                  pdfUrl={legislation.pdf_url}
                  extractedText={legislation.full_text}
                  docUrl={legislation.doc_url}
                  title={legislation.title}
                />
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Status Timeline - Collapsible */}
          <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
            <Card className="p-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className="text-base font-semibold">Status Timeline</h2>
                <ChevronDown className={`h-4 w-4 transition-transform ${timelineOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <LegislationTimeline
                  currentStatus={legislation.status || 'introduced'}
                  introducedAt={legislation.introduced_at}
                  passedAt={legislation.passed_at}
                  effectiveAt={legislation.effective_at}
                />
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Related Meetings - Collapsible */}
          {relatedMeetings && relatedMeetings.length > 0 && (
            <Collapsible open={relatedOpen} onOpenChange={setRelatedOpen}>
              <Card className="p-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h2 className="text-base font-semibold">Related Meetings</h2>
                  <ChevronDown className={`h-4 w-4 transition-transform ${relatedOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-2">
                    {relatedMeetings.map((meeting) => (
                      <Link
                        key={meeting.id}
                        to={`/meetings/${meeting.id}`}
                        className="block p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-sm">{meeting.title}</div>
                        {meeting.starts_at && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(meeting.starts_at), "PPP")}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Related Info - Collapsible */}
          <Collapsible open={relatedOpen} onOpenChange={setRelatedOpen}>
            <Card className="p-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className="text-base font-semibold">Contact & Source</h2>
                <ChevronDown className={`h-4 w-4 transition-transform ${relatedOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <RelatedInfo
                  jurisdiction={legislation.jurisdiction}
                  externalId={legislation.external_id}
                  sourceUrl={legislation.source_url}
                  docUrl={legislation.doc_url}
                  people={legislation.people}
                />
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Metadata - Collapsible (at bottom) */}
          <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
            <Card className="p-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className="text-base font-semibold">Metadata</h2>
                <ChevronDown className={`h-4 w-4 transition-transform ${metadataOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="text-xs space-y-1 text-muted-foreground">
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
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {/* LEFT COLUMN - Main Content (2/3 width) */}
          <div className="col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight">{legislation.title}</h1>
              
              <div className="flex flex-wrap items-center gap-2">
                {legislation.jurisdiction && (
                  <Badge variant="secondary" className="text-xs">
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
          <div className="col-span-1 space-y-6">
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

        {/* Sticky Quick Actions Bar - Mobile Only */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-background border-t p-2 flex gap-2 z-40">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-9 text-sm"
            asChild
          >
            <a 
              href={legislation.doc_url || legislation.source_url || legislation.pdf_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Original
            </a>
          </Button>
          <QuickActions legislationId={id!} legislationTitle={legislation.title} isMobile />
        </div>
      </div>
    </Layout>
  );
}
