import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFViewerProps {
  pdfUrl?: string | null;
  extractedText?: string | null;
  docUrl?: string | null;
  title: string;
}

export function PDFViewer({ pdfUrl, extractedText, docUrl, title }: PDFViewerProps) {
  const [pdfError, setPdfError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        <CardContent className="space-y-3">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Search tip:</strong> Use <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Ctrl+F</kbd> (or <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Cmd+F</kbd> on Mac) to search within the PDF.
            </AlertDescription>
          </Alert>
          
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading PDF...</p>
                </div>
              </div>
            )}
            <iframe
              src={pdfUrl}
              className="w-full h-[800px] md:h-[600px] border rounded"
              title={title}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setPdfError(true);
                setIsLoading(false);
              }}
            />
          </div>
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
