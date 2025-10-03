import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";

interface EmptyListsStateProps {
  onCreateList: () => void;
}

export function EmptyListsState({ onCreateList }: EmptyListsStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <FolderPlus className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Create your first list to organize legislation by topic, location, or any category that makes sense for your work.
      </p>
      <Button onClick={onCreateList}>
        <FolderPlus className="w-4 h-4 mr-2" />
        Create Your First List
      </Button>
    </div>
  );
}
