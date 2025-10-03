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
      className="h-8 gap-1 px-2.5 text-xs md:h-9 md:gap-1.5 md:px-3 md:text-sm"
    >
      <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
      <span className="hidden sm:inline">Clear All</span>
      <span className="sm:hidden">Clear</span>
    </Button>
  );
}
