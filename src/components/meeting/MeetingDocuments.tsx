import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/DocumentPreview";
import { FileText, Video, Clock, ExternalLink } from "lucide-react";
import { isDocumentRecent } from "@/lib/meetingUtils";

interface MeetingDocumentsProps {
  agendaUrl?: string;
  minutesUrl?: string;
  extractedText?: string;
  livestreamUrl?: string;
  recordingUrl?: string;
  agendaAvailableAt?: string | null;
  minutesAvailableAt?: string | null;
  status?: string;
}

export function MeetingDocuments({ 
  agendaUrl, 
  minutesUrl, 
  extractedText, 
  livestreamUrl, 
  recordingUrl,
  agendaAvailableAt,
  minutesAvailableAt,
  status = 'upcoming'
}: MeetingDocumentsProps) {
  const hasMultipleDocs = [agendaUrl, minutesUrl, extractedText].filter(Boolean).length > 1;
  const agendaIsNew = isDocumentRecent(agendaAvailableAt);
  const minutesAreNew = isDocumentRecent(minutesAvailableAt);

  // If no documents at all
  if (!agendaUrl && !minutesUrl && !extractedText && !livestreamUrl && !recordingUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Documents not yet available for this meeting.
        </CardContent>
      </Card>
    );
  }

  // Quick actions section for livestream/recording
  const renderQuickActions = () => {
    if (status === 'in_progress' && livestreamUrl) {
      return (
        <div className="mb-4">
          <Button asChild className="w-full" variant="destructive">
            <a href={livestreamUrl} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              Watch Live Now
              <Badge variant="secondary" className="ml-2 animate-pulse">LIVE</Badge>
            </a>
          </Button>
        </div>
      );
    }
    
    if (status === 'upcoming' && livestreamUrl) {
      return (
        <div className="mb-4">
          <Button asChild className="w-full" variant="outline">
            <a href={livestreamUrl} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              Livestream Link
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>
        </div>
      );
    }
    
    if (status === 'completed' && recordingUrl) {
      return (
        <div className="mb-4">
          <Button asChild className="w-full" variant="outline">
            <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              Watch Recording
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>
        </div>
      );
    }
    
    return null;
  };

  // If only one document type, show without tabs
  if (!hasMultipleDocs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {agendaUrl && (
              <span className="flex items-center gap-2">
                Meeting Agenda
                {agendaIsNew && <Badge variant="secondary" className="text-xs">New</Badge>}
              </span>
            )}
            {minutesUrl && !agendaUrl && (
              <span className="flex items-center gap-2">
                Meeting Minutes
                {minutesAreNew && <Badge variant="secondary" className="text-xs">New</Badge>}
              </span>
            )}
            {extractedText && !agendaUrl && !minutesUrl && "Meeting Text"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderQuickActions()}
          {agendaUrl && (
            <iframe 
              src={agendaUrl}
              className="w-full h-[600px] md:h-[800px] border rounded"
              title="Meeting Agenda"
            />
          )}
          {minutesUrl && !agendaUrl && (
            <iframe 
              src={minutesUrl}
              className="w-full h-[600px] md:h-[800px] border rounded"
              title="Meeting Minutes"
            />
          )}
          {extractedText && !agendaUrl && !minutesUrl && (
            <DocumentPreview text={extractedText} />
          )}
        </CardContent>
      </Card>
    );
  }

  // Multiple documents - show tabs
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Meeting Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderQuickActions()}
        <Tabs defaultValue={agendaUrl ? "agenda" : minutesUrl ? "minutes" : "text"}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[agendaUrl, minutesUrl, extractedText].filter(Boolean).length}, 1fr)` }}>
            {agendaUrl && (
              <TabsTrigger value="agenda" className="flex items-center gap-1">
                Agenda
                {agendaIsNew && <Badge variant="secondary" className="text-xs ml-1">New</Badge>}
              </TabsTrigger>
            )}
            {minutesUrl && (
              <TabsTrigger value="minutes" className="flex items-center gap-1">
                Minutes
                {minutesAreNew && <Badge variant="secondary" className="text-xs ml-1">New</Badge>}
              </TabsTrigger>
            )}
            {extractedText && (
              <TabsTrigger value="text">Full Text</TabsTrigger>
            )}
          </TabsList>

          {agendaUrl && (
            <TabsContent value="agenda" className="mt-4">
              <iframe 
                src={agendaUrl}
                className="w-full h-[600px] md:h-[800px] border rounded"
                title="Meeting Agenda"
              />
            </TabsContent>
          )}

          {minutesUrl && (
            <TabsContent value="minutes" className="mt-4">
              <iframe 
                src={minutesUrl}
                className="w-full h-[600px] md:h-[800px] border rounded"
                title="Meeting Minutes"
              />
            </TabsContent>
          )}

          {extractedText && (
            <TabsContent value="text" className="mt-4">
              <DocumentPreview text={extractedText} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
