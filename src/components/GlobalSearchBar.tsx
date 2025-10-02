import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface SearchResult {
  id: string;
  type: 'legislation' | 'meeting';
  title: string;
  snippet: string;
  jurisdiction: string;
  date: string;
  url: string;
}

interface GlobalSearchBarProps {
  onResultClick?: () => void;
}

export function GlobalSearchBar({ onResultClick }: GlobalSearchBarProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        return [];
      }

      const { data, error } = await supabase.functions.invoke('search', {
        body: {
          query: debouncedQuery,
          limit: 5
        }
      });

      if (error) throw error;
      return (data?.results || []) as SearchResult[];
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
      setIsFocused(false);
    }
  };

  const handleResultClick = (url: string) => {
    navigate(url);
    setIsOpen(false);
    setIsFocused(false);
    setSearchQuery("");
    onResultClick?.();
  };

  const handleViewAll = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
      setIsFocused(false);
      onResultClick?.();
    }
  };

  const legislationResults = searchResults?.filter(r => r.type === 'legislation') || [];
  const meetingResults = searchResults?.filter(r => r.type === 'meeting') || [];

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search legislation, meetings..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (searchQuery.length > 0) {
              setIsOpen(true);
            }
          }}
          className={`pl-9 pr-9 transition-all duration-200 ${
            isFocused ? 'w-full md:w-[500px]' : 'w-full md:w-[300px]'
          }`}
          aria-label="Search"
          aria-describedby="search-description"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <span id="search-description" className="sr-only">
          Type to search legislation and meetings
        </span>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery.length > 0 && (
        <div className="absolute top-full mt-2 w-full md:w-[500px] bg-background border rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="p-2" role="listbox">
              {legislationResults.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                    Legislation ({legislationResults.length})
                  </p>
                  {legislationResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.url)}
                      className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition-colors"
                      role="option"
                    >
                      <p className="font-medium text-sm line-clamp-1">{result.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {result.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{result.jurisdiction}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(result.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {meetingResults.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                    Meetings ({meetingResults.length})
                  </p>
                  {meetingResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.url)}
                      className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition-colors"
                      role="option"
                    >
                      <p className="font-medium text-sm line-clamp-1">{result.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {result.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">Meeting</Badge>
                        <span className="text-xs text-muted-foreground">{result.jurisdiction}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(result.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <button
                  onClick={handleViewAll}
                  className="w-full px-3 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors font-medium"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
