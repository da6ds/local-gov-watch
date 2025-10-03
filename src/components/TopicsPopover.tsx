import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTopics } from "@/hooks/useTopics";
import { getGuestTopics, setGuestTopics } from "@/lib/guestSessionStorage";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TopicsPopover() {
  const queryClient = useQueryClient();
  const { data: availableTopics = [] } = useTopics();
  const [selectedTopics, setSelectedTopicsState] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  // Initialize from sessionStorage
  useEffect(() => {
    setSelectedTopicsState(getGuestTopics());
  }, []);

  const isAllSelected = selectedTopics.length === 0;

  const filteredTopics = availableTopics.filter((topic) =>
    topic.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleAll = () => {
    setSelectedTopicsState([]);
    setGuestTopics([]);
    invalidateQueries();
  };

  const handleToggleTopic = (slug: string) => {
    const updated = selectedTopics.includes(slug)
      ? selectedTopics.filter((t) => t !== slug)
      : [...selectedTopics, slug];
    
    // If last topic deselected, auto-select All
    const finalUpdated = updated.length === 0 ? [] : updated;
    setSelectedTopicsState(finalUpdated);
    setGuestTopics(finalUpdated);
    invalidateQueries();
  };

  const invalidateQueries = () => {
    // Debounce query invalidation
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['legislation'] });
      queryClient.invalidateQueries({ queryKey: ['meetings-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['meetings-past'] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    }, 200);
  };

  const getBadgeText = () => {
    if (isAllSelected) return "All";
    return selectedTopics.length.toString();
  };

  const getTooltipText = () => {
    if (isAllSelected) return "All topics";
    const preview = selectedTopics
      .slice(0, 3)
      .map((slug) => availableTopics.find((t) => t.slug === slug)?.label)
      .filter(Boolean)
      .join(", ");
    return selectedTopics.length > 3
      ? `${preview}, +${selectedTopics.length - 3} more`
      : preview;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <Popover open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs md:h-10 md:gap-2 md:px-4 md:text-sm"
                aria-expanded={open}
                aria-controls="topics-popover"
              >
                <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Topics</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                  {getBadgeText()}
                </Badge>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{getTooltipText()}</p>
          </TooltipContent>
          <PopoverContent
            id="topics-popover"
            className="w-80 p-4"
            align="end"
            onOpenAutoFocus={(e) => {
              // Prevent default auto-focus and focus search input instead
              e.preventDefault();
              const container = e.target as HTMLElement;
              const searchInput = container.querySelector('input[type="text"]');
              if (searchInput instanceof HTMLInputElement) {
                setTimeout(() => searchInput.focus(), 0);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by Topics</h4>
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {/* All chip - mutually exclusive */}
                <button
                  onClick={handleToggleAll}
                  role="button"
                  aria-pressed={isAllSelected}
                  className="transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                >
                  <Badge
                    variant={isAllSelected ? "default" : "outline"}
                    className={`cursor-pointer hover:scale-105 transition-transform ${
                      isAllSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    All Topics
                  </Badge>
                </button>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {filteredTopics.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.slug);
                    return (
                      <button
                        key={topic.slug}
                        onClick={() => handleToggleTopic(topic.slug)}
                        role="button"
                        aria-pressed={isSelected}
                        className="transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                      >
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer hover:scale-105 transition-transform ${
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          {topic.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {filteredTopics.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No topics found
                  </p>
                )}
              </div>

              {selectedTopics.length > 0 && (
                <div className="pt-2 border-t flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedTopics.length} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleAll}
                    className="h-7 px-2"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
}
