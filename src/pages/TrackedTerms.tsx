import { useState } from "react";
import { Plus, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedTermsList } from "@/components/tracked-terms/TrackedTermsList";
import { CreateTrackedTermDialog } from "@/components/tracked-terms/CreateTrackedTermDialog";
import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";

export default function TrackedTerms() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-3">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold">My Tracked Terms</h1>
            <p className="text-xs text-muted-foreground">
              Monitor specific keywords in new legislation and meetings
            </p>
          </div>
          
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Term
          </Button>
        </div>

        {/* Demo Mode Banner */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          Demo Mode - Terms saved for this session only
        </div>

        {/* Main Content */}
        <TrackedTermsList />
      </div>

      <CreateTrackedTermDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Layout>
  );
}
