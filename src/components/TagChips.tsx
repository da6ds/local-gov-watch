import { Badge } from "@/components/ui/badge";

interface TagChipsProps {
  tags: string[];
  maxVisible?: number;
}

export function TagChips({ tags, maxVisible = 5 }: TagChipsProps) {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1 md:gap-1.5">
      {visibleTags.map((tag) => (
        <Badge 
          key={tag} 
          variant="secondary" 
          className="tag-chip py-0.5 px-1.5 text-[10px] md:py-1 md:px-2 md:text-xs"
        >
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge 
          variant="secondary" 
          className="tag-chip py-0.5 px-1.5 text-[10px] md:py-1 md:px-2 md:text-xs"
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}