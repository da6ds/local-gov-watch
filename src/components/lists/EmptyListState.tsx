import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyListStateProps {
  onCreateList?: () => void;
  isPreview?: boolean;
}

export function EmptyListState({ onCreateList, isPreview }: EmptyListStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FolderOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Create lists to organize and track legislation, meetings, and elections that matter to you.
      </p>
      {isPreview ? (
        <p className="text-sm text-muted-foreground">
          Sign in to create and manage your lists
        </p>
      ) : (
        <Button onClick={onCreateList}>Create Your First List</Button>
      )}
    </div>
  );
}
