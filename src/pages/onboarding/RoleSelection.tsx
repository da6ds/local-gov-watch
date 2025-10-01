import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_TOPICS, UserRole } from "@/lib/roleTopics";
import { useToast } from "@/hooks/use-toast";

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!selectedRole || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile')
        .update({ user_role: selectedRole })
        .eq('id', user.id);

      if (error) throw error;

      navigate('/onboarding/location');
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to save your role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Welcome to Local Gov Watch</h1>
          <p className="text-lg text-muted-foreground">Help us personalize your experience</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What best describes you?</CardTitle>
            <CardDescription>We'll customize topics and insights based on your role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(ROLE_TOPICS).map(([key, role]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key as UserRole)}
                  className={`
                    touch-target p-6 rounded-lg border-2 transition-all text-left
                    ${selectedRole === key 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="text-4xl mb-3">{role.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{role.label}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Focus areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {role.defaultTopics.slice(0, 3).map(topic => (
                        <span key={topic} className="tag-chip text-xs">{topic}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleContinue}
                disabled={!selectedRole || loading}
                size="lg"
                className="min-w-[150px]"
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Step 1 of 2 • You can change this later in settings
        </p>
      </div>
    </div>
  );
}
