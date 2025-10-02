import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ExternalLink, Calendar, MapPin, Video } from "lucide-react";
import { format, isToday } from "date-fns";
import { Helmet } from "react-helmet-async";
import { MeetingStatus } from "@/components/meeting/MeetingStatus";
import { MeetingDocuments } from "@/components/meeting/MeetingDocuments";
import { AgendaItems } from "@/components/meeting/AgendaItems";
import { RelatedMeetings } from "@/components/meeting/RelatedMeetings";

export default function MeetingDetail() {
  const { id } = useParams();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting')
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
    queryKey: ['meeting-topics', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('item_topic')
        .select('topic, confidence')
        .eq('item_id', id)
        .eq('item_type', 'meeting')
        .order('confidence', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  const generateICS = () => {
    if (!meeting) return;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${meeting.title || 'Meeting'}
DTSTART:${meeting.starts_at ? format(new Date(meeting.starts_at), "yyyyMMdd'T'HHmmss") : ''}
DTEND:${meeting.ends_at ? format(new Date(meeting.ends_at), "yyyyMMdd'T'HHmmss") : ''}
LOCATION:${meeting.location || ''}
DESCRIPTION:${meeting.ai_summary || ''}
URL:${window.location.href}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meeting.ics';
    link.click();
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

  if (!meeting) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Meeting not found</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const attachments = meeting.attachments as Array<{ 
    title: string; 
    url?: string;
    time?: string;
    type?: string;
    description?: string;
    document_url?: string;
    video_url?: string;
    stream_url?: string;
  }> || [];

  const streamUrl = attachments.find(a => a.stream_url)?.stream_url;
  const videoUrl = attachments.find(a => a.video_url)?.video_url;
  const isTodaysMeeting = meeting.starts_at ? isToday(new Date(meeting.starts_at)) : false;

  return (
    <Layout>
      <Helmet>
        <title>{meeting.title} - {meeting.body_name || 'Meeting'} - Local Gov Watch</title>
        <meta name="description" content={meeting.ai_summary?.slice(0, 160) || `Meeting details for ${meeting.title}`} />
        <meta property="og:title" content={meeting.title} />
        <meta property="og:type" content="event" />
        <meta property="og:description" content={meeting.ai_summary?.slice(0, 160)} />
      </Helmet>

      <div className="container mx-auto py-6 px-4">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link to="/browse/meetings">Meetings</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="text-foreground">{meeting.title}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Two-column grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Header */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">{meeting.title}</h1>
              
              <div className="flex flex-wrap items-center gap-2">
                {meeting.jurisdiction && (
                  <Badge variant="secondary">
                    {meeting.jurisdiction.name}
                  </Badge>
                )}
                {meeting.body_name && (
                  <Badge variant="outline">{meeting.body_name}</Badge>
                )}
              </div>

              {/* Date, Time, Location */}
              <div className="space-y-2 text-sm">
                {meeting.starts_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(meeting.starts_at), "PPPP 'at' p")}
                      {meeting.ends_at && ` - ${format(new Date(meeting.ends_at), "p")}`}
                    </span>
                  </div>
                )}
                {meeting.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{meeting.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Summary */}
            {meeting.ai_summary && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Summary</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{meeting.ai_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Topic Tags */}
            {topics && topics.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Topics</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <Link 
                        key={topic.topic}
                        to={`/browse/meetings?topic=${encodeURIComponent(topic.topic)}`}
                      >
                        <Badge 
                          variant="outline"
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          {topic.topic}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agenda Items */}
            <AgendaItems attachments={attachments} />

            {/* Meeting Documents (Tabbed Viewer) */}
            <MeetingDocuments 
              agendaUrl={meeting.agenda_url}
              minutesUrl={meeting.minutes_url}
              extractedText={meeting.extracted_text}
            />

            {/* Metadata */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Metadata</h2>
              </CardHeader>
              <CardContent className="text-sm space-y-1 text-muted-foreground">
                {meeting.external_id && (
                  <div>
                    <span className="font-medium">External ID:</span> {meeting.external_id}
                  </div>
                )}
                {meeting.updated_at && (
                  <div>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {format(new Date(meeting.updated_at), "PPP")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR (1/3 width) */}
          <div className="lg:col-span-1 space-y-4">
            {/* Meeting Status */}
            {meeting.starts_at && (
              <MeetingStatus startsAt={meeting.starts_at} />
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Actions</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={generateICS}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>

                {isTodaysMeeting && streamUrl && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={streamUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Live
                    </a>
                  </Button>
                )}

                {!isTodaysMeeting && videoUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      View Recording
                    </a>
                  </Button>
                )}

                {meeting.agenda_url && (
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href={meeting.agenda_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Agenda
                    </a>
                  </Button>
                )}

                {meeting.minutes_url && (
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href={meeting.minutes_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Minutes
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related Meetings */}
            {meeting.starts_at && (
              <RelatedMeetings 
                currentMeetingId={meeting.id}
                bodyName={meeting.body_name}
                startsAt={meeting.starts_at}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
