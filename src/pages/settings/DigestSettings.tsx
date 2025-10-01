import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Save } from "lucide-react";
import { TOPIC_KEYWORDS } from "@/lib/constants";

export default function DigestSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [scope, setScope] = useState<'city' | 'county' | 'both'>('county');
  const [cadence, setCadence] = useState<'instant' | 'daily' | 'weekly'>('weekly');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['digest-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('subscription')
        .select('*')
        .eq('user_id', user.id)
        .eq('channel', 'email')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const dataScope = data.scope as 'city' | 'county' | 'both' | null;
        const dataCadence = data.cadence as 'instant' | 'daily' | 'weekly' | null;
        
        setScope(dataScope || 'county');
        setCadence(dataCadence || 'weekly');
        setSelectedTopics(data.topics || []);
      }
      
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const subscriptionData = {
        user_id: user.id,
        scope,
        cadence,
        topics: selectedTopics,
        channel: 'email' as const,
        query_json: {},
      };

      if (subscription) {
        const { error } = await supabase
          .from('subscription')
          .update(subscriptionData)
          .eq('id', subscription.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription')
          .insert(subscriptionData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digest-subscription'] });
      toast({
        title: "Settings saved",
        description: "Your digest preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    },
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
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sign in to customize your digest</h3>
              <p className="text-muted-foreground mb-4">
                Create an account to receive personalized weekly updates about local government activity
              </p>
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Weekly Digest Settings</h1>
            <p className="text-muted-foreground">
              Customize your email digest to stay informed about the topics that matter most to you
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading settings...
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scope</CardTitle>
                  <CardDescription>
                    Choose which jurisdictions to include in your digest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'city' | 'county' | 'both')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="city" id="city" />
                      <Label htmlFor="city">My city only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="county" id="county" />
                      <Label htmlFor="county">My county (includes all cities)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both">Both city and county</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cadence</CardTitle>
                  <CardDescription>
                    How often would you like to receive digest emails?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={cadence} onValueChange={(v) => setCadence(v as 'instant' | 'daily' | 'weekly')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="instant" id="instant" />
                      <Label htmlFor="instant">Instant (as updates happen)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Daily summary</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Weekly digest (recommended)</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Topics</CardTitle>
                  <CardDescription>
                    Select the topics you want to track (leave empty for all)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(TOPIC_KEYWORDS).map((topic) => (
                      <div key={topic} className="flex items-center space-x-2">
                        <Checkbox
                          id={topic}
                          checked={selectedTopics.includes(topic)}
                          onCheckedChange={() => toggleTopic(topic)}
                        />
                        <Label htmlFor={topic} className="capitalize cursor-pointer">
                          {topic.replace(/-/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
