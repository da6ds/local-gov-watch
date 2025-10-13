import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/DocumentPreview";
import { FileText, Video, Clock, ExternalLink, CheckCircle2, XCircle, Pause, Download, Paperclip } from "lucide-react";
import { isDocumentRecent } from "@/lib/meetingUtils";
import { format, addHours } from "date-fns";

interface PacketDocument {
  title: string;
  url: string;
  type: string;
}

interface VotingRecord {
  item: string;
  result: string;
  votes?: {
    yes: string[];
    no: string[];
    abstain: string[];
  } | null;
}

interface MeetingDocumentsProps {
  agendaUrl?: string;
  minutesUrl?: string;
  extractedText?: string;
  livestreamUrl?: string;
  recordingUrl?: string;
  agendaAvailableAt?: string | null;
  minutesAvailableAt?: string | null;
  agendaStatus?: string;
  minutesStatus?: string;
  packetUrls?: PacketDocument[];
  votingRecords?: VotingRecord[];
  status?: string;
  startsAt?: string;
}

export function MeetingDocuments({ 
  agendaUrl, 
  minutesUrl, 
  extractedText, 
  livestreamUrl, 
  recordingUrl,
  agendaAvailableAt,
  minutesAvailableAt,
  agendaStatus = 'not_published',
  minutesStatus = 'not_published',
  packetUrls = [],
  votingRecords = [],
  status = 'upcoming',
  startsAt
}: MeetingDocumentsProps) {
  const hasMultipleDocs = [agendaUrl, minutesUrl, extractedText].filter(Boolean).length > 1;
  const agendaIsNew = isDocumentRecent(agendaAvailableAt);
  const minutesAreNew = isDocumentRecent(minutesAvailableAt);
  
  const getBrownActDeadline = () => {
    if (!startsAt) return null;
    const meetingDate = new Date(startsAt);
    const deadline = addHours(meetingDate, -72);
    return deadline;
  };

  const getStatusBadge = (statusType: string, statusValue: string) => {
    const variants: Record<string, { color: string; text: string }> = {
      available: { color: "bg-green-500", text: "Available" },
      not_published: { color: "bg-gray-400", text: "Not Published" },
      unavailable: { color: "bg-red-500", text: "Unavailable" },
      draft: { color: "bg-yellow-500", text: "Draft" },
      approved: { color: "bg-blue-500", text: "Approved" },
    };
    
    const variant = variants[statusValue] || variants.not_published;
    return (
      <Badge className={`${variant.color} text-white`}>
        {variant.text}
      </Badge>
    );
  };

  const renderVotingRecords = () => {
    if (!votingRecords || votingRecords.length === 0) return null;

    const getResultIcon = (result: string) => {
      switch (result) {
        case 'passed':
          return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        case 'failed':
          return <XCircle className="h-5 w-5 text-red-600" />;
        case 'continued':
          return <Pause className="h-5 w-5 text-yellow-600" />;
        default:
          return null;
      }
    };

    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Key Outcomes
        </h3>
        <div className="space-y-3">
          {votingRecords.map((record, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                {getResultIcon(record.result)}
                <div className="flex-1">
                  <p className="font-medium">{record.item}</p>
                  <p className="text-sm text-muted-foreground uppercase font-semibold mt-1">
                    {record.result}
                    {record.votes && ` (${record.votes.yes.length}-${record.votes.no.length})`}
                  </p>
                  {record.votes && (
                    <div className="mt-2 text-sm space-y-1">
                      {record.votes.yes.length > 0 && (
                        <p><span className="font-medium">Yes:</span> {record.votes.yes.join(', ')}</p>
                      )}
                      {record.votes.no.length > 0 && (
                        <p><span className="font-medium">No:</span> {record.votes.no.join(', ')}</p>
                      )}
                      {record.votes.abstain.length > 0 && (
                        <p><span className="font-medium">Abstain:</span> {record.votes.abstain.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPacketDocuments = () => {
    if (!packetUrls || packetUrls.length === 0) return null;

    return (
      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Agenda Packet ({packetUrls.length} documents)
        </h3>
        <div className="space-y-2">
          {packetUrls.map((doc, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              asChild
              className="w-full justify-start"
            >
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                {doc.title}
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // If no documents at all
  if (!agendaUrl && !minutesUrl && !extractedText && !livestreamUrl && !recordingUrl) {
    const brownActDeadline = getBrownActDeadline();
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agendaStatus === 'not_published' && status === 'upcoming' && (
            <div className="text-sm space-y-2">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Agenda Not Yet Published
              </p>
              <p className="text-muted-foreground text-xs">
                California law requires agendas 72 hours before meetings.
                {brownActDeadline && (
                  <> Check back after {format(brownActDeadline, 'MMMM d, yyyy')}.</>
                )}
              </p>
            </div>
          )}
          {agendaStatus === 'unavailable' && (
            <p className="text-sm text-muted-foreground">
              Agenda is not available for this meeting.
            </p>
          )}
          {status === 'completed' && minutesStatus === 'not_published' && (
            <p className="text-sm text-muted-foreground">
              Minutes typically take 2-4 weeks to be approved and published.
            </p>
          )}
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
                {getStatusBadge('agenda', agendaStatus)}
              </span>
            )}
            {minutesUrl && !agendaUrl && (
              <span className="flex items-center gap-2">
                Meeting Minutes
                {minutesAreNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                {getStatusBadge('minutes', minutesStatus)}
              </span>
            )}
            {extractedText && !agendaUrl && !minutesUrl && "Meeting Text"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderQuickActions()}
          
          {agendaUrl && (
            <>
              <div className="mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {agendaAvailableAt && (
                    <>Published: {format(new Date(agendaAvailableAt), 'MMMM d, yyyy')}</>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button asChild>
                    <a href={agendaUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Agenda PDF
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={agendaUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground italic mt-2">
                  💡 Agendas show what will be discussed and when public comment periods occur.
                </p>
              </div>
              {renderPacketDocuments()}
              <iframe 
                src={agendaUrl}
                className="w-full h-[600px] md:h-[800px] border rounded mt-4"
                title="Meeting Agenda"
              />
            </>
          )}
          
          {minutesUrl && !agendaUrl && (
            <>
              <div className="mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Status: {getStatusBadge('minutes', minutesStatus)}
                  {minutesAvailableAt && (
                    <> • Published: {format(new Date(minutesAvailableAt), 'MMMM d, yyyy')}</>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button asChild>
                    <a href={minutesUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Minutes PDF
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={minutesUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
              {renderVotingRecords()}
              <iframe 
                src={minutesUrl}
                className="w-full h-[600px] md:h-[800px] border rounded mt-4"
                title="Meeting Minutes"
              />
            </>
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
            <TabsContent value="agenda" className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge('agenda', agendaStatus)}
                  {agendaAvailableAt && (
                    <span className="text-sm text-muted-foreground">
                      Published: {format(new Date(agendaAvailableAt), 'MMMM d, yyyy')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <a href={agendaUrl} target="_blank" rel="noopener noreferrer">
                      View Agenda PDF
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={agendaUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  💡 Agendas show what will be discussed and when public comment periods occur.
                </p>
              </div>
              {renderPacketDocuments()}
              <iframe 
                src={agendaUrl}
                className="w-full h-[600px] md:h-[800px] border rounded"
                title="Meeting Agenda"
              />
            </TabsContent>
          )}

          {minutesUrl && (
            <TabsContent value="minutes" className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge('minutes', minutesStatus)}
                  {minutesAvailableAt && (
                    <span className="text-sm text-muted-foreground">
                      Published: {format(new Date(minutesAvailableAt), 'MMMM d, yyyy')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <a href={minutesUrl} target="_blank" rel="noopener noreferrer">
                      View Minutes PDF
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={minutesUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
              {renderVotingRecords()}
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
