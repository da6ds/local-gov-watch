import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ExternalLink, AlertCircle, Loader2, Search } from "lucide-react";
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
  const [currentUrl, setCurrentUrl] = useState(pdfUrl);
  const [searchTerm, setSearchTerm] = useState("");

  // Try fallback to docUrl if pdfUrl fails
  useEffect(() => {
    if (pdfError && docUrl && currentUrl !== docUrl) {
      console.log('PDF failed to load, trying doc_url fallback:', docUrl);
      setCurrentUrl(docUrl);
      setPdfError(false);
      setIsLoading(true);
    }
  }, [pdfError, docUrl, currentUrl]);

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

  if ((pdfUrl || currentUrl) && !pdfError) {
    const displayUrl = currentUrl || pdfUrl;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Full Document (PDF)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={displayUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in new tab
            </a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

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
              src={displayUrl}
              className="w-full min-h-[600px] border rounded"
              title={title}
              onLoad={() => {
                setIsLoading(false);
                console.log('PDF loaded successfully:', displayUrl);
              }}
              onError={() => {
                console.error('PDF failed to load:', displayUrl);
                setPdfError(true);
                setIsLoading(false);
              }}
            />
          </div>

          {pdfError && docUrl && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>PDF failed to load</span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={docUrl} target="_blank" rel="noopener noreferrer">
                    Try opening in new tab
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
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
