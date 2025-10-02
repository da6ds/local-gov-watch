import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentPreview } from "@/components/DocumentPreview";
import { FileText } from "lucide-react";

interface MeetingDocumentsProps {
  agendaUrl?: string;
  minutesUrl?: string;
  extractedText?: string;
}

export function MeetingDocuments({ agendaUrl, minutesUrl, extractedText }: MeetingDocumentsProps) {
  const hasMultipleDocs = [agendaUrl, minutesUrl, extractedText].filter(Boolean).length > 1;

  // If no documents at all
  if (!agendaUrl && !minutesUrl && !extractedText) {
    return null;
  }

  // If only one document type, show without tabs
  if (!hasMultipleDocs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {agendaUrl && "Meeting Agenda"}
            {minutesUrl && "Meeting Minutes"}
            {extractedText && "Meeting Text"}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        <Tabs defaultValue={agendaUrl ? "agenda" : minutesUrl ? "minutes" : "text"}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[agendaUrl, minutesUrl, extractedText].filter(Boolean).length}, 1fr)` }}>
            {agendaUrl && (
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            )}
            {minutesUrl && (
              <TabsTrigger value="minutes">Minutes</TabsTrigger>
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
