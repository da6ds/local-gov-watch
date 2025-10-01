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
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="tag-chip">
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="tag-chip">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}