import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ExternalLink, AlertCircle, Loader2, FileText } from "lucide-react";
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
  const [showExtractedText, setShowExtractedText] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('PDFViewer props:', {
      hasPdfUrl: !!pdfUrl,
      hasDocUrl: !!docUrl,
      hasExtractedText: !!extractedText,
      textLength: extractedText?.length,
      actualPdfUrl: pdfUrl,
      actualDocUrl: docUrl
    });
  }, [pdfUrl, docUrl, extractedText]);

  // Try fallback to docUrl if pdfUrl fails
  useEffect(() => {
    if (pdfError && docUrl && currentUrl !== docUrl) {
      console.log('PDF failed to load, trying doc_url fallback:', docUrl);
      setCurrentUrl(docUrl);
      setPdfError(false);
      setIsLoading(true);
    }
  }, [pdfError, docUrl, currentUrl]);

  // Timeout-based detection for PDFs that don't trigger onError (e.g., X-Frame-Options blocks)
  useEffect(() => {
    if (!currentUrl && !pdfUrl) return;
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('PDF loading timeout - likely blocked by X-Frame-Options');
        setPdfError(true);
        setIsLoading(false);
        // Let user manually choose to view text via button
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [currentUrl, pdfUrl, isLoading]);

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

  if ((pdfUrl || currentUrl) && !showExtractedText) {
    const displayUrl = currentUrl || pdfUrl;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Full Document</CardTitle>
          <div className="flex gap-2">
            {extractedText && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtractedText(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Text
              </Button>
            )}
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
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pdfError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                PDF preview unavailable - the document cannot be embedded. Click "Open in new tab" above to view the PDF.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading document...</p>
                </div>
              </div>
            )}
            <object
              data={displayUrl}
              type="application/pdf"
              className="w-full min-h-[600px] border rounded bg-muted/20"
              onLoad={() => {
                setIsLoading(false);
                console.log('PDF loaded successfully:', displayUrl);
              }}
            >
              <div className="flex flex-col items-center justify-center min-h-[600px] p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">PDF cannot be displayed inline</p>
                <p className="text-sm text-muted-foreground mb-4">
                  This document cannot be embedded due to security restrictions.
                </p>
                <Button asChild>
                  <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open PDF in new tab
                  </a>
                </Button>
              </div>
            </object>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (extractedText) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Full Document Text</CardTitle>
          {(pdfUrl || docUrl) && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={pdfUrl || docUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open PDF
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DocumentPreview text={extractedText} maxChars={2000} />
        </CardContent>
      </Card>
    );
  }

  return null;
}
