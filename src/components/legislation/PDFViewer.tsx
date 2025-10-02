import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFViewerProps {
  pdfUrl?: string | null;
  extractedText?: string | null;
  docUrl?: string | null;
  title: string;
}

export function PDFViewer({ pdfUrl, extractedText, docUrl, title }: PDFViewerProps) {
  const [pdfError, setPdfError] = useState(false);

  if (!pdfUrl && !extractedText) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Document not yet available.
              {docUrl && (
                <Button
                  variant="link"
                  className="ml-2 p-0 h-auto"
                  asChild
                >
                  <a href={docUrl} target="_blank" rel="noopener noreferrer">
                    View on external site <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (pdfUrl && !pdfError) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Full Document (PDF)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in new tab
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <iframe
            src={pdfUrl}
            className="w-full h-[800px] md:h-[600px] border rounded"
            title={title}
            onError={() => setPdfError(true)}
          />
        </CardContent>
      </Card>
    );
  }

  if (extractedText) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Full Document Text</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentPreview text={extractedText} maxChars={2000} />
        </CardContent>
      </Card>
    );
  }

  return null;
}
