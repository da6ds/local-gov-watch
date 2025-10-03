import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";

interface DocumentPreviewProps {
  text: string;
  maxChars?: number;
  pdfUrl?: string;
}

export function DocumentPreview({ text, maxChars = 1500, pdfUrl }: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Remove URL Source line if present
  const cleanedText = text.replace(/^URL Source:.*?\n/m, '');

  if (!cleanedText) return null;

  const displayText = isExpanded ? cleanedText : cleanedText.slice(0, maxChars);
  const needsExpansion = cleanedText.length > maxChars;

  const countMatches = (content: string, search: string): number => {
    if (!search.trim()) return 0;
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (content.match(regex) || []).length;
  };

  const matchCount = countMatches(cleanedText, searchTerm);

  const highlightText = (content: string) => {
    if (!searchTerm.trim()) return content;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 text-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm md:h-10 md:text-base"
          />
        </div>
        {searchTerm.trim() && (
          <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </div>
        )}
      </div>

      <div className="max-w-full overflow-x-hidden bg-muted/30 p-3 md:p-4 rounded-lg">
        <pre className="whitespace-pre-wrap break-words font-sans text-sm overflow-wrap-break-word" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          {highlightText(displayText)}
        </pre>
        {needsExpansion && !isExpanded && (
          <div className="text-muted-foreground text-sm mt-2">... (truncated)</div>
        )}
        
        {pdfUrl && (
          <div className="mt-4 pt-4 border-t flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-sm"
              asChild
            >
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Original PDF
              </a>
            </Button>
          </div>
        )}
      </div>

      {needsExpansion && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}
