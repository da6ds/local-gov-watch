import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLE_TOPICS, UserRole } from "@/lib/roleTopics";
import { updateGuestProfile, getGuestSessionId } from "@/lib/guestSession";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";

export default function GuestRole() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedRole) return;

    const sessionId = getGuestSessionId();
    if (!sessionId) {
      toast.error("Guest session not found");
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      await updateGuestProfile(sessionId, { userRole: selectedRole });
      toast.success("Role selected!");
      navigate("/onboarding/guest-location");
    } catch (error) {
      toast.error("Failed to save role");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome to Guest Mode!</h1>
            <p className="text-muted-foreground">
              Pick your role to personalize your experience
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>I am a...</CardTitle>
              <CardDescription>Choose the role that best describes you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(ROLE_TOPICS).map(([key, role]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key as UserRole)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRole === key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <div className="font-semibold">{role.label}</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedRole || loading}
            >
              Continue
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Step 1 of 2
          </div>
        </div>
      </div>
    </Layout>
  );
}
