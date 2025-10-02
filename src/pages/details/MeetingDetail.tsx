import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentPreview } from "@/components/DocumentPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, Calendar, MapPin, Paperclip } from "lucide-react";
import { format } from "date-fns";

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

  const attachments = meeting.attachments as Array<{ title: string; url: string }> || [];

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{meeting.title}</h1>
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
          </div>

          {/* Meeting Details */}
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

          {/* Sticky Actions */}
          <div className="flex flex-wrap gap-2 sticky top-4 z-10 bg-background/95 backdrop-blur p-2 -mx-2 rounded-lg border">
            <Button variant="outline" size="sm" onClick={generateICS}>
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            {meeting.agenda_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={meeting.agenda_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Agenda
                </a>
              </Button>
            )}
            {meeting.minutes_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={meeting.minutes_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  View Minutes
                </a>
              </Button>
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

        {/* Attachments */}
        {attachments.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{attachment.title}</span>
                      <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Text */}
        {meeting.extracted_text && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Meeting Text</h2>
            </CardHeader>
            <CardContent>
              <DocumentPreview text={meeting.extracted_text} />
            </CardContent>
          </Card>
        )}

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
    </Layout>
  );
}
