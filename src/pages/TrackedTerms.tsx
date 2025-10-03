import { useState } from "react";
import { Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrackedTermsList } from "@/components/tracked-terms/TrackedTermsList";
import { CreateTrackedTermDialog } from "@/components/tracked-terms/CreateTrackedTermDialog";

export default function TrackedTerms() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="container max-w-5xl py-6 md:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">My Tracked Terms</h1>
          <p className="text-muted-foreground">
            Monitor specific keywords in new legislation and meetings
          </p>
        </div>

        {/* Demo Mode Banner */}
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100">Demo Mode</AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Your tracked terms are saved for this browser session only. They'll be lost when you close the tab.
            <Button variant="link" className="p-0 h-auto ml-2 text-yellow-900 dark:text-yellow-100">
              Save Permanently
            </Button>
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tracked Term
          </Button>
        </div>

        <TrackedTermsList />
      </div>

      <CreateTrackedTermDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
