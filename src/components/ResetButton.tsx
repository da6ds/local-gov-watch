import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ResetButton() {
  const navigate = useNavigate();

  const handleReset = () => {
    // Clear all session storage
    sessionStorage.clear();
    
    // Navigate back to landing page
    navigate('/');
    
    // Show confirmation
    toast.success('Demo reset - starting fresh!');
    
    // Hard reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Demo?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all your demo data including tracked terms, preferences, and settings. You'll be taken back to the landing page to start fresh.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>
            Reset Demo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
