import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ListCardProps {
  name: string;
  description?: string;
  itemCount: number;
  billsCount?: number;
  meetingsCount?: number;
  electionsCount?: number;
  isDefault?: boolean;
  isPreview?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ListCard({
  name,
  description,
  itemCount,
  billsCount = 0,
  meetingsCount = 0,
  electionsCount = 0,
  isDefault = false,
  isPreview = false,
  onClick,
  onEdit,
  onDelete,
}: ListCardProps) {
  return (
    <Card 
      className={`transition-all hover:shadow-md cursor-pointer ${isDefault ? 'bg-muted/30' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 flex items-center gap-2">
              {name}
              {isPreview && (
                <Badge variant="outline" className="text-xs font-normal">
                  Preview
                </Badge>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="line-clamp-2">{description}</CardDescription>
            )}
          </div>
          {!isDefault && (
            <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onEdit}
                      disabled={isPreview}
                    >
                      {isPreview ? <Lock className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPreview ? "Sign in to edit" : "Edit list"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDelete}
                      disabled={isPreview}
                    >
                      {isPreview ? <Lock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPreview ? "Sign in to delete" : "Delete list"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Badge>
          {billsCount > 0 && (
            <Badge variant="default" className="text-xs">
              {billsCount} {billsCount === 1 ? 'bill' : 'bills'}
            </Badge>
          )}
          {meetingsCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {meetingsCount} {meetingsCount === 1 ? 'meeting' : 'meetings'}
            </Badge>
          )}
          {electionsCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {electionsCount} {electionsCount === 1 ? 'election' : 'elections'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
