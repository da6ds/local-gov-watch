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
        // Automatically show extracted text if available
        if (extractedText) {
          setShowExtractedText(true);
        }
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [currentUrl, pdfUrl, isLoading, extractedText]);

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
    
    // Show only loading spinner during initial load
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        </div>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Full Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pdfError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                PDF preview unavailable - the document cannot be embedded.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="relative">
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
      <div className="space-y-3">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The PDF cannot be displayed inline due to security settings on the source website. We've extracted the text below for easy reading.
          </AlertDescription>
        </Alert>
        <DocumentPreview 
          text={extractedText} 
          maxChars={2000}
          pdfUrl={pdfUrl || docUrl || undefined}
        />
      </div>
    );
  }

  return null;
}
