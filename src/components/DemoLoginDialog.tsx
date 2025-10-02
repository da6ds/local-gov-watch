import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDemoUser } from "@/hooks/useDemoUser";

interface DemoLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoLoginDialog({ open, onOpenChange }: DemoLoginDialogProps) {
  const [name, setName] = useState("");
  const { startDemo } = useDemoUser();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    startDemo(name.trim());
    onOpenChange(false);
    toast.success(`Welcome, ${name.trim()}! Explore stances, lists, and alerts.`);
    navigate("/stances");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Try Local Gov Watch</DialogTitle>
          <DialogDescription>
            Enter your name to personalize your demo experience.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Your demo data will be saved for this browser session only
          </p>
          <Button type="submit" className="w-full">
            Start Demo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
