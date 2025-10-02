import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailPreviewDialogProps {
  name: string;
  locations: string[];
  topics: string[];
  cadence: 'daily' | 'weekly' | 'biweekly';
  disabled?: boolean;
}

export function EmailPreviewDialog({
  name,
  locations,
  topics,
  cadence,
  disabled
}: EmailPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const handlePreview = async () => {
    setIsLoading(true);
    console.log('[EmailPreview] Generating preview...');

    try {
      const { data, error } = await supabase.functions.invoke('preview-digest-email', {
        body: {
          name: name || 'there',
          locations,
          topics: topics.length > 0 ? topics : null,
          cadence,
        },
      });

      if (error) {
        console.error('[EmailPreview] Error:', error);
        throw error;
      }

      if (data && typeof data === 'object' && 'error' in data) {
        console.error('[EmailPreview] Edge function error:', data);
        toast.error("Failed to generate preview", {
          description: (data as any).error
        });
        return;
      }

      if (data && data.html) {
        console.log('[EmailPreview] Preview generated successfully');
        setHtmlContent(data.html);
      } else {
        throw new Error('No HTML content returned');
      }
    } catch (error) {
      console.error('[EmailPreview] Caught error:', error);
      toast.error("Failed to generate preview", {
        description: "Please try again or check your selections."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !htmlContent) {
      handlePreview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full"
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview Email HTML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription>
            This is how your email digest will look when sent.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Generating preview...</span>
          </div>
        ) : htmlContent ? (
          <ScrollArea className="h-[70vh] w-full rounded-md border">
            <div 
              className="p-4"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Click the button above to generate a preview
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            This preview uses your current selections and real data from the database.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreview()}
            disabled={isLoading}
          >
            Refresh Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
