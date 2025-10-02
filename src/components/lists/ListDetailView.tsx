import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ListItemCard } from "./ListItemCard";

interface ListItem {
  id: string;
  entityType: "legislation" | "meeting" | "election";
  entityId: string;
  title: string;
  subtitle: string;
  date?: string;
}

interface ListDetailViewProps {
  name: string;
  description?: string;
  items: ListItem[];
  onBack: () => void;
  onRemoveItem?: (itemId: string) => void;
  isPreview?: boolean;
}

export function ListDetailView({
  name,
  description,
  items,
  onBack,
  onRemoveItem,
  isPreview = false,
}: ListDetailViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lists
        </Button>
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        {description && (
          <p className="text-muted-foreground mb-2">{description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items in this list yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ListItemCard
              key={item.id}
              entityType={item.entityType}
              entityId={item.entityId}
              title={item.title}
              subtitle={item.subtitle}
              date={item.date}
              onRemove={() => onRemoveItem?.(item.id)}
              isPreview={isPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
