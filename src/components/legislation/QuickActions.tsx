import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, Eye, XCircle, Bookmark, Bell } from "lucide-react";
import { toast } from "sonner";
import { setStance, getStance, type StanceType } from "@/lib/stanceStorage";

interface QuickActionsProps {
  legislationId: string;
  legislationTitle: string;
}

export function QuickActions({ legislationId, legislationTitle }: QuickActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStance, setCurrentStance] = useState<StanceType>(null);

  useEffect(() => {
    setCurrentStance(getStance(legislationId));
  }, [legislationId]);

  const handleStanceClick = (stance: StanceType) => {
    setStance(legislationId, legislationTitle, stance);
    setCurrentStance(stance);
    setIsDialogOpen(false);
    
    const stanceLabel = stance === 'support' ? 'Support' 
      : stance === 'oppose' ? 'Oppose'
      : stance === 'watching' ? 'Watching'
      : 'Unimportant';
    
    toast.success(`Stance saved: ${stanceLabel}`, {
      description: "Saved locally. Your stance will persist across sessions."
    });
  };

  const handleRemoveStance = () => {
    setStance(legislationId, legislationTitle, null);
    setCurrentStance(null);
    setIsDialogOpen(false);
    toast.success("Stance removed");
  };

  const getStanceLabel = () => {
    if (!currentStance) return "Set Stance";
    return currentStance === 'support' ? "Stance: Support"
      : currentStance === 'oppose' ? "Stance: Oppose"
      : currentStance === 'watching' ? "Stance: Watching"
      : "Stance: Unimportant";
  };

  const getStanceVariant = () => {
    if (!currentStance) return "outline";
    return "secondary";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant={getStanceVariant()}
            className="w-full" 
            onClick={() => setIsDialogOpen(true)}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            {getStanceLabel()}
          </Button>

          <Button variant="outline" className="w-full" disabled>
            <Bookmark className="h-4 w-4 mr-2" />
            Add to List
            <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
          </Button>

          <Button variant="outline" className="w-full" disabled>
            <Bell className="h-4 w-4 mr-2" />
            Get Notified
            <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Your Stance</DialogTitle>
            <DialogDescription>
              Choose your position on this legislation. Your stance is saved locally.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => handleStanceClick('support')}
            >
              <ThumbsUp className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Support</div>
                <div className="text-xs text-muted-foreground">I'm in favor of this legislation</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => handleStanceClick('oppose')}
            >
              <ThumbsDown className="h-5 w-5 mr-3 text-red-600" />
              <div className="text-left">
                <div className="font-semibold">Oppose</div>
                <div className="text-xs text-muted-foreground">I'm against this legislation</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => handleStanceClick('watching')}
            >
              <Eye className="h-5 w-5 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Watching</div>
                <div className="text-xs text-muted-foreground">I want to track this without taking a position</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => handleStanceClick('unimportant')}
            >
              <XCircle className="h-5 w-5 mr-3 text-gray-400" />
              <div className="text-left">
                <div className="font-semibold">Unimportant</div>
                <div className="text-xs text-muted-foreground">This doesn't affect my interests</div>
              </div>
            </Button>

            {currentStance && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleRemoveStance}
                >
                  Remove Stance
                </Button>
              </>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p>
              💡 <strong>Note:</strong> Stances are saved in your browser's local storage. 
              Create an account (coming soon) to sync across devices.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
