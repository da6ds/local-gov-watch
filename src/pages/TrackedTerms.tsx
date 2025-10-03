import { useState } from "react";
import { Plus, Search, Bell, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrackedTermsList } from "@/components/tracked-terms/TrackedTermsList";
import { CreateTrackedTermDialog } from "@/components/tracked-terms/CreateTrackedTermDialog";

export default function TrackedTerms() {
  const [email, setEmail] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setHasSubmittedEmail(true);
      // Store in sessionStorage for demo mode
      sessionStorage.setItem('trackedTermsEmail', email);
    }
  };

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

        {/* Email Input Section */}
        {!hasSubmittedEmail && (
          <Card className="p-4 md:p-6">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Enter your email to view/manage your tracked terms
                </label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit">Continue</Button>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your tracked terms will be saved and accessible with this email from any device
                </AlertDescription>
              </Alert>
            </form>
          </Card>
        )}

        {/* Main Content */}
        {hasSubmittedEmail && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Monitoring terms for: <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tracked Term
              </Button>
            </div>

            <TrackedTermsList email={email} />
          </>
        )}
      </div>

      <CreateTrackedTermDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        email={email}
      />
    </div>
  );
}
