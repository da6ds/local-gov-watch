import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ROLE_TOPICS, UserRole } from "@/lib/roleTopics";
import { TOPIC_KEYWORDS } from "@/lib/constants";
import { Link } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [role, setRole] = useState<UserRole | ''>('');
  const [scope, setScope] = useState<'city' | 'county' | 'state'>('city');
  const [jurisdictionId, setJurisdictionId] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cadence, setCadence] = useState<'instant' | 'daily' | 'weekly'>('weekly');

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

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

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('subscription')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Populate form from existing data
  useEffect(() => {
    if (profile) {
      setRole(profile.user_role || '');
      const defaultScope = profile.default_scope as 'city' | 'county' | 'state' | null;
      setScope(defaultScope || 'city');
      setJurisdictionId(profile.selected_jurisdiction_id || '');
    }
  }, [profile]);

  useEffect(() => {
    if (subscription) {
      setSelectedTopics(subscription.topics || []);
      const subscriptionCadence = subscription.cadence as 'instant' | 'daily' | 'weekly' | null;
      setCadence(subscriptionCadence || 'weekly');
    }
  }, [subscription]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Update profile
      const { error: profileError } = await supabase
        .from('profile')
        .update({
          user_role: role || null,
          default_scope: scope,
          selected_jurisdiction_id: jurisdictionId || null
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Upsert subscription
      if (subscription) {
        const { error: subError } = await supabase
          .from('subscription')
          .update({
            scope,
            topics: selectedTopics,
            cadence
          })
          .eq('id', subscription.id);

        if (subError) throw subError;
      } else {
        const { error: subError } = await supabase
          .from('subscription')
          .insert({
            user_id: user.id,
            scope,
            topics: selectedTopics,
            cadence,
            query_json: {}
          });

        if (subError) throw subError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  if (!user) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please <Link to="/auth" className="text-primary hover:underline">sign in</Link> to access settings.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </Layout>
    );
  }

  const suggestedTopics = role && role in ROLE_TOPICS 
    ? ROLE_TOPICS[role].defaultTopics 
    : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your experience and notification preferences</p>
        </div>

        <div className="grid gap-6">
          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Your Role</CardTitle>
              <CardDescription>Help us tailor content and suggestions for you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(ROLE_TOPICS).map(([key, roleInfo]) => (
                  <button
                    key={key}
                    onClick={() => setRole(key as UserRole)}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${role === key 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{roleInfo.icon}</div>
                    <h3 className="font-semibold text-foreground">{roleInfo.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{roleInfo.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location & Scope */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Scope</CardTitle>
              <CardDescription>Choose your primary jurisdiction and level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Scope Level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['city', 'county', 'state'] as const).map(s => (
                    <Button
                      key={s}
                      variant={scope === s ? 'default' : 'outline'}
                      onClick={() => setScope(s as 'city' | 'county' | 'state')}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Jurisdiction</Label>
                <Select value={jurisdictionId} onValueChange={setJurisdictionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select jurisdiction..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions?.filter(j => j.type === scope).map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Topics of Interest */}
          <Card>
            <CardHeader>
              <CardTitle>Topics of Interest</CardTitle>
              <CardDescription>
                Select topics to customize your dashboard and digests
                {suggestedTopics.length > 0 && (
                  <span className="block mt-1 text-primary">
                    ✨ Suggestions based on your role
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.keys(TOPIC_KEYWORDS).map(topic => {
                  const isSuggested = suggestedTopics.includes(topic);
                  return (
                    <div
                      key={topic}
                      className={`
                        flex items-start space-x-3 p-3 rounded-lg border
                        ${isSuggested ? 'border-accent/50 bg-accent/5' : 'border-border'}
                      `}
                    >
                      <Checkbox
                        id={topic}
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={() => toggleTopic(topic)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={topic}
                          className="text-sm font-medium cursor-pointer capitalize"
                        >
                          {topic.replace(/-/g, ' ')}
                          {isSuggested && <span className="ml-2 text-accent">★</span>}
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Digest Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Digest Cadence</CardTitle>
              <CardDescription>How often would you like to receive email updates?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { value: 'instant', label: 'Instant', desc: 'Real-time notifications' },
                  { value: 'daily', label: 'Daily', desc: 'One email per day' },
                  { value: 'weekly', label: 'Weekly', desc: 'Every Monday morning' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setCadence(option.value as 'instant' | 'daily' | 'weekly')}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${cadence === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <h3 className="font-semibold text-foreground">{option.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              size="lg"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
