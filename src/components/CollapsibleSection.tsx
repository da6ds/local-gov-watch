import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  storageKey: string;
  title: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsibleSection({
  storageKey,
  title,
  icon,
  badge,
  children,
  defaultExpanded = true,
  className
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLocked, setIsLocked] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`dashboard-${storageKey}`);
    if (savedState) {
      try {
        const { expanded, locked } = JSON.parse(savedState);
        setIsExpanded(expanded);
        setIsLocked(locked);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }
  }, [storageKey]);

  // Handle lock toggle
  const handleLockToggle = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);

    if (newLocked) {
      // Save current state when locking
      localStorage.setItem(`dashboard-${storageKey}`, JSON.stringify({
        expanded: isExpanded,
        locked: true
      }));
    } else {
      // Remove saved state when unlocking
      localStorage.removeItem(`dashboard-${storageKey}`);
      // Revert to default state
      setIsExpanded(defaultExpanded);
    }
  };

  // Handle expand/collapse toggle
  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // If locked, update saved state
    if (isLocked) {
      localStorage.setItem(`dashboard-${storageKey}`, JSON.stringify({
        expanded: newExpanded,
        locked: true
      }));
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-semibold">{title}</h2>
            {badge}
          </div>

          <div className="flex items-center gap-1">
            {/* Lock button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLockToggle}
              className="h-8 w-8"
              title={isLocked ? "Unlock (resets to default on reload)" : "Lock (remembers state)"}
            >
              {isLocked ? (
                <Lock className="h-4 w-4 text-yellow-500" />
              ) : (
                <LockOpen className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Collapse/Expand button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleExpand}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
