import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface InteractiveTopicChipsProps {
  topics: Array<{ slug: string; label: string }>;
  selectedTopics: string[];
  onToggle: (slug: string) => void;
  onClear?: () => void;
  showClear?: boolean;
  maxVisible?: number;
}

export function InteractiveTopicChips({
  topics,
  selectedTopics,
  onToggle,
  onClear,
  showClear = true,
  maxVisible,
}: InteractiveTopicChipsProps) {
  const displayTopics = maxVisible ? topics.slice(0, maxVisible) : topics;
  const hasSelection = selectedTopics.length > 0;

  return (
    <div className="flex flex-wrap gap-2">
      {displayTopics.map((topic) => {
        const isSelected = selectedTopics.includes(topic.slug);
        return (
          <button
            key={topic.slug}
            onClick={() => onToggle(topic.slug)}
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
      {showClear && hasSelection && onClear && (
        <button
          onClick={onClear}
          className="transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
        >
          <Badge
            variant="secondary"
            className="cursor-pointer hover:scale-105 transition-transform flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </Badge>
        </button>
      )}
    </div>
  );
}
