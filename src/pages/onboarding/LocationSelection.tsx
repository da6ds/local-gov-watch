import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ROLE_TOPICS } from "@/lib/roleTopics";

export default function LocationSelection() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<'city' | 'county' | 'state'>('city');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch jurisdictions
  const { data: jurisdictions } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jurisdiction')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user's role for topic suggestions
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profile')
        .select('user_role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Default to Austin city
  useEffect(() => {
    if (jurisdictions && !selectedJurisdiction) {
      const austin = jurisdictions.find(j => j.slug === 'austin-tx');
      if (austin) {
        setSelectedJurisdiction(austin.id);
      }
    }
  }, [jurisdictions, selectedJurisdiction]);

  const handleComplete = async () => {
    if (!selectedJurisdiction || !user) return;

    setLoading(true);
    try {
      // Get suggested topics based on role
      const role = userProfile?.user_role;
      const suggestedTopics = role ? [...ROLE_TOPICS[role].defaultTopics] : [];

      const { error } = await supabase
        .from('profile')
        .update({ 
          selected_jurisdiction_id: selectedJurisdiction,
          default_scope: selectedScope,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;

      // Create initial subscription with suggested topics
      if (suggestedTopics.length > 0) {
        await supabase
          .from('subscription')
          .insert([{
            user_id: user.id,
            scope: selectedScope,
            topics: suggestedTopics,
            cadence: 'weekly',
            query_json: {}
          }]);
      }

      toast({
        title: "Welcome!",
        description: "Your account is all set up. Let's explore local government data.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cityJurisdictions = jurisdictions?.filter(j => j.type === 'city') || [];
  const countyJurisdictions = jurisdictions?.filter(j => j.type === 'county') || [];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Choose Your Location</h1>
          <p className="text-lg text-muted-foreground">We'll show you relevant local government updates</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select your primary jurisdiction</CardTitle>
            <CardDescription>You can always change this or add more locations later</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Scope Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['city', 'county', 'state'] as const).map(scope => (
                    <Button
                      key={scope}
                      variant={selectedScope === scope ? 'default' : 'outline'}
                      onClick={() => setSelectedScope(scope)}
                      className="touch-target capitalize"
                    >
                      {scope}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {selectedScope === 'city' ? 'City' : selectedScope === 'county' ? 'County' : 'State'}
                </label>
                <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                  <SelectTrigger className="touch-target">
                    <SelectValue placeholder={`Select ${selectedScope}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedScope === 'city' && cityJurisdictions.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                    {selectedScope === 'county' && countyJurisdictions.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                    {selectedScope === 'state' && jurisdictions?.filter(j => j.type === 'state').map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {userProfile?.user_role && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Based on your role as {ROLE_TOPICS[userProfile.user_role].label}, we'll focus on:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_TOPICS[userProfile.user_role].defaultTopics.map(topic => (
                      <span key={topic} className="tag-chip">{topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/onboarding/role')}
              >
                Back
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={!selectedJurisdiction || loading}
                size="lg"
                className="min-w-[150px]"
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Step 2 of 2 • Your data stays private and secure
        </p>
      </div>
    </div>
  );
}
