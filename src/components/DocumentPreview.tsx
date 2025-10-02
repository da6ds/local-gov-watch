import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface DocumentPreviewProps {
  text: string;
  maxChars?: number;
}

export function DocumentPreview({ text, maxChars = 1500 }: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (!text) return null;

  const displayText = isExpanded ? text : text.slice(0, maxChars);
  const needsExpansion = text.length > maxChars;

  const countMatches = (content: string, search: string): number => {
    if (!search.trim()) return 0;
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (content.match(regex) || []).length;
  };

  const matchCount = countMatches(text, searchTerm);

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm.trim() && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </div>
        )}
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-lg">
        <pre className="whitespace-pre-wrap font-sans text-sm">
          {highlightText(displayText)}
        </pre>
        {needsExpansion && !isExpanded && (
          <div className="text-muted-foreground">... (truncated)</div>
        )}
      </div>

      {needsExpansion && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}
