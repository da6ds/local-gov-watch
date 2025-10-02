import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClearAllButtonProps {
  onClear: () => void;
  show: boolean;
}

export function ClearAllButton({ onClear, show }: ClearAllButtonProps) {
  if (!show) return null;

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onClear}
      className="gap-1"
    >
      <X className="h-4 w-4" />
      Clear All
    </Button>
  );
}
