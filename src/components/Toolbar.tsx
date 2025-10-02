import { cn } from "@/lib/utils";

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 h-10 px-0",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ToolbarSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolbarLeft({ children, className }: ToolbarSectionProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {children}
    </div>
  );
}

export function ToolbarRight({ children, className }: ToolbarSectionProps) {
  return (
    <div className={cn("flex items-center gap-3 ml-auto", className)}>
      {children}
    </div>
  );
}
