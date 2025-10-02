import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText, ExternalLink } from "lucide-react";

interface AgendaItem {
  title: string;
  time?: string;
  type?: string;
  description?: string;
  document_url?: string;
  url?: string; // Fallback for generic attachments
}

interface AgendaItemsProps {
  attachments: AgendaItem[];
}

export function AgendaItems({ attachments }: AgendaItemsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Check if we have structured agenda items (with time/type fields)
  const isStructured = attachments.some(item => item.time || item.type || item.description);

  // If structured, use accordion
  if (isStructured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agenda Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {attachments.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 flex-wrap text-left">
                    {item.time && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.time}
                      </Badge>
                    )}
                    {item.type && (
                      <Badge variant="secondary" className="text-xs">
                        {item.type}
                      </Badge>
                    )}
                    <span className="font-medium">{item.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {item.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    {(item.document_url || item.url) && (
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={item.document_url || item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View Document
                        </a>
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    );
  }

  // Otherwise, show simple list (fallback for generic attachments)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Attachments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attachments.map((attachment, idx) => (
            <a
              key={idx}
              href={attachment.url || attachment.document_url}
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
  );
}
