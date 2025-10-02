import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateGuestProfile, getGuestSessionId, getGuestProfile } from "@/lib/guestSession";
import { ROLE_TOPICS } from "@/lib/roleTopics";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";

export default function GuestLocation() {
  const [selectedScope, setSelectedScope] = useState<'city' | 'county' | 'state'>('city');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const { data: guestProfile } = useQuery({
    queryKey: ['guest-profile', getGuestSessionId()],
    queryFn: async () => {
      const sessionId = getGuestSessionId();
      if (!sessionId) return null;
      return getGuestProfile(sessionId);
    }
  });

  // Auto-select Austin and city scope on mount
  useEffect(() => {
    if (jurisdictions && !selectedJurisdiction) {
      const austin = jurisdictions.find(j => j.slug === 'austin-tx' && j.type === 'city');
      if (austin) {
        setSelectedScope('city');
        setSelectedJurisdiction(austin.id);
      }
    }
  }, [jurisdictions, selectedJurisdiction]);

  const filteredJurisdictions = jurisdictions?.filter(j => j.type === selectedScope) || [];

  const handleComplete = async () => {
    const sessionId = getGuestSessionId();
    if (!sessionId || !selectedJurisdiction) {
      toast.error("Please select a jurisdiction");
      return;
    }

    setLoading(true);
    try {
      // Get suggested topics based on role
      const suggestedTopics = guestProfile?.userRole 
        ? [...(ROLE_TOPICS[guestProfile.userRole as keyof typeof ROLE_TOPICS]?.defaultTopics || [])]
        : [];

      // Find the selected jurisdiction to get parent jurisdictions
      const selectedJuris = jurisdictions?.find(j => j.id === selectedJurisdiction);
      
      // For Austin, also get Travis County and Texas
      let countyId = null;
      let stateId = null;
      
      if (selectedJuris?.type === 'city') {
        const county = jurisdictions?.find(j => j.type === 'county' && j.slug === 'travis-county-tx');
        const state = jurisdictions?.find(j => j.type === 'state' && j.slug === 'texas');
        countyId = county?.id;
        stateId = state?.id;
      }

      await updateGuestProfile(sessionId, {
        selectedJurisdictionId: selectedJurisdiction,
        defaultScope: selectedScope,
        topics: suggestedTopics
      });

      toast.success("Setup complete! Loading live data...");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to save location");
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
            <h1 className="text-3xl font-bold">Choose Your Area</h1>
            <p className="text-muted-foreground">
              Select your primary jurisdiction to track
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Geographic Focus</CardTitle>
              <CardDescription>We'll show you relevant legislation and meetings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Scope</label>
                <div className="flex gap-2">
                  {(['city', 'county', 'state'] as const).map((scope) => (
                    <Button
                      key={scope}
                      variant={selectedScope === scope ? "default" : "outline"}
                      onClick={() => {
                        setSelectedScope(scope);
                        setSelectedJurisdiction('');
                      }}
                      className="flex-1 capitalize"
                    >
                      {scope}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {selectedScope === 'city' && 'City'}
                  {selectedScope === 'county' && 'County'}
                  {selectedScope === 'state' && 'State'}
                </label>
                <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${selectedScope}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredJurisdictions.map((jurisdiction) => (
                      <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                        {jurisdiction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {guestProfile?.userRole && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Suggested Topics for {ROLE_TOPICS[guestProfile.userRole as keyof typeof ROLE_TOPICS]?.label}:</p>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_TOPICS[guestProfile.userRole as keyof typeof ROLE_TOPICS]?.defaultTopics.map((topic) => (
                      <span key={topic} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/onboarding/guest-role")}>
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!selectedJurisdiction || loading}
            >
              Get Started
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Step 2 of 2
          </div>
        </div>
      </div>
    </Layout>
  );
}
