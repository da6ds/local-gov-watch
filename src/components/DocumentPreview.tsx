import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";

interface DocumentPreviewProps {
  text: string;
  maxChars?: number;
  pdfUrl?: string;
}

export function DocumentPreview({ text, maxChars = 1500, pdfUrl }: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const contentRef = useRef<HTMLPreElement>(null);
  
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

  // Reset current match when search term changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchTerm]);

  // Scroll to current match
  const scrollToMatch = useCallback(() => {
    if (!searchTerm.trim() || matchCount === 0) return;
    
    const matchElements = contentRef.current?.querySelectorAll('.search-highlight');
    if (matchElements && matchElements[currentMatchIndex]) {
      matchElements[currentMatchIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      
      // Flash animation
      matchElements[currentMatchIndex].classList.add('search-flash');
      setTimeout(() => {
        matchElements[currentMatchIndex]?.classList.remove('search-flash');
      }, 1000);
    }
  }, [searchTerm, currentMatchIndex, matchCount]);

  useEffect(() => {
    scrollToMatch();
  }, [currentMatchIndex, scrollToMatch]);

  const navigateToNext = () => {
    if (matchCount === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchCount);
  };

  const navigateToPrevious = () => {
    if (matchCount === 0) return;
    setCurrentMatchIndex((prev) => (prev === 0 ? matchCount - 1 : prev - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if ((e.key === 'F3' || e.key === 'Enter') && searchTerm.trim()) {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPrevious();
        } else {
          navigateToNext();
        }
      } else if (e.key === 'Escape' && searchTerm) {
        e.preventDefault();
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, matchCount]);

  const highlightText = (content: string) => {
    if (!searchTerm.trim()) return content;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);
    let matchIndex = 0;

    return parts.map((part, i) => {
      if (regex.test(part)) {
        const isCurrentMatch = matchIndex === currentMatchIndex;
        const className = isCurrentMatch 
          ? "search-highlight search-current" 
          : "search-highlight";
        matchIndex++;
        return (
          <mark key={i} className={className}>
            {part}
          </mark>
        );
      }
      return part;
    });
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
        {matchCount > 0 && (
          <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-md text-sm">
            <span className="text-muted-foreground whitespace-nowrap">
              {currentMatchIndex + 1} of {matchCount}
            </span>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToPrevious}
                className="h-6 w-6 p-0"
                aria-label="Previous match"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToNext}
                className="h-6 w-6 p-0"
                aria-label="Next match"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
        {searchTerm.trim() && matchCount === 0 && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md whitespace-nowrap">
            No matches
          </div>
        )}
      </div>

      <div className="max-w-full overflow-x-hidden bg-muted/30 p-3 md:p-4 rounded-lg document-content">
        <pre 
          ref={contentRef}
          className="whitespace-pre-wrap break-words font-sans text-sm overflow-wrap-break-word" 
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        >
          {highlightText(displayText)}
        </pre>
        {needsExpansion && !isExpanded && (
          <div className="text-muted-foreground text-sm mt-2">... (truncated)</div>
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

      {pdfUrl && (
        <Button
          variant="outline"
          className="w-full mt-4 h-9 text-sm"
          asChild
        >
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Original PDF
          </a>
        </Button>
      )}
    </div>
  );
}
