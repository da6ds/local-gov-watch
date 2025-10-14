import { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ChevronUp, ChevronDown, ExternalLink, Download } from 'lucide-react';

interface DocumentTextViewerProps {
  text: string;
  pdfUrl?: string;
  documentType: 'agenda' | 'minutes';
}

export function DocumentTextViewer({ text, pdfUrl, documentType }: DocumentTextViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Find all matches when search query changes
  useEffect(() => {
    if (!searchQuery || !text) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const foundMatches: number[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      foundMatches.push(match.index);
    }

    setMatches(foundMatches);
    setCurrentMatchIndex(0);
  }, [searchQuery, text]);

  // Scroll to current match
  useEffect(() => {
    if (matches.length > 0 && matchRefs.current[currentMatchIndex]) {
      matchRefs.current[currentMatchIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentMatchIndex, matches]);

  const goToPreviousMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    }
  };

  const goToNextMatch = () => {
    if (currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  };

  // Highlight matches in text
  const highlightedText = useMemo(() => {
    if (!searchQuery || matches.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    matches.forEach((matchIndex, i) => {
      // Text before match
      if (lastIndex < matchIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>
        );
      }

      // Highlighted match
      const isCurrentMatch = i === currentMatchIndex;
      parts.push(
        <span
          key={`match-${i}`}
          ref={(el) => (matchRefs.current[i] = el)}
          className={
            isCurrentMatch
              ? 'bg-yellow-500 text-black font-semibold px-0.5 rounded'
              : 'bg-yellow-500/30 text-yellow-200 px-0.5 rounded'
          }
        >
          {text.slice(matchIndex, matchIndex + searchQuery.length)}
        </span>
      );

      lastIndex = matchIndex + searchQuery.length;
    });

    // Remaining text
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{parts}</p>;
  }, [searchQuery, matches, currentMatchIndex, text]);

  return (
    <div className="border-t border-border p-4 space-y-3">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Match counter and navigation */}
        {searchQuery && matches.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">
              {currentMatchIndex + 1} of {matches.length}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={goToPreviousMatch}
                disabled={currentMatchIndex === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={goToNextMatch}
                disabled={currentMatchIndex === matches.length - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {searchQuery && matches.length === 0 && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">No matches</span>
        )}
      </div>

      {/* Scrollable Text Container */}
      <div
        ref={textContainerRef}
        className="border border-border rounded-lg p-4 bg-muted/30 overflow-y-auto max-h-[500px] text-sm"
      >
        {highlightedText}
      </div>

      {/* PDF Links */}
      {pdfUrl && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open PDF
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={pdfUrl} download>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
