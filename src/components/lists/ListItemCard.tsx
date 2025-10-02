import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";

interface ListItemCardProps {
  entityType: "legislation" | "meeting" | "election";
  entityId: string;
  title: string;
  subtitle: string;
  date?: string;
  onRemove?: () => void;
  isPreview?: boolean;
}

export function ListItemCard({
  entityType,
  entityId,
  title,
  subtitle,
  date,
  onRemove,
  isPreview = false,
}: ListItemCardProps) {
  const getEntityBadge = () => {
    switch (entityType) {
      case "legislation":
        return <Badge variant="default">Legislation</Badge>;
      case "meeting":
        return <Badge variant="secondary">Meeting</Badge>;
      case "election":
        return <Badge variant="outline">Election</Badge>;
    }
  };

  const getDetailLink = () => {
    switch (entityType) {
      case "legislation":
        return `/legislation/${entityId}`;
      case "meeting":
        return `/meetings/${entityId}`;
      case "election":
        return `/elections/${entityId}`;
    }
  };

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="cursor-move pt-1 text-muted-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getEntityBadge()}
            </div>
            <Link 
              to={getDetailLink()} 
              className="font-medium hover:underline block mb-1"
            >
              {title}
            </Link>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            {date && (
              <p className="text-xs text-muted-foreground mt-1">{date}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isPreview}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
