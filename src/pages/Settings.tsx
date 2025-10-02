import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { TOPIC_KEYWORDS } from "@/lib/constants";
import { getGuestScope, setGuestScope, getGuestTopics, setGuestTopics } from "@/lib/guestSessionStorage";
import { LocationSelector } from "@/components/LocationSelector";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const queryClient = useQueryClient();
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cadence, setCadence] = useState<'instant' | 'daily' | 'weekly'>('weekly');

  // Load from sessionStorage on mount
  useEffect(() => {
    setSelectedJurisdictions(getGuestScope());
    setSelectedTopics(getGuestTopics());
  }, []);

  const toggleTopic = (topic: string) => {
    const updated = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    
    setSelectedTopics(updated);
    setGuestTopics(updated);
    
    // Immediately invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['browse'] });
    queryClient.invalidateQueries({ queryKey: ['trends'] });
    
    toast.success("Topics updated");
  };

  const handleJurisdictionChange = (slugs: string[]) => {
    setSelectedJurisdictions(slugs);
    setGuestScope(slugs);
    
    // Immediately invalidate queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['browse'] });
    queryClient.invalidateQueries({ queryKey: ['trends'] });
    
    toast.success("Location updated");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your demo experience</p>
        </div>

        <div className="grid gap-6">
          {/* Location Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Select up to 3 jurisdictions to follow</CardDescription>
            </CardHeader>
            <CardContent>
              <LocationSelector
                value={selectedJurisdictions}
                onChange={handleJurisdictionChange}
                maxSelections={3}
                placeholder="Select locations..."
              />
            </CardContent>
          </Card>

          {/* Topics of Interest */}
          <Card>
            <CardHeader>
              <CardTitle>Topics of Interest</CardTitle>
              <CardDescription>
                Select topics to filter your dashboard and calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.keys(TOPIC_KEYWORDS).map(topic => (
                  <div
                    key={topic}
                    className="flex items-start space-x-3 p-3 rounded-lg border"
                  >
                    <Checkbox
                      id={topic}
                      checked={selectedTopics.includes(topic)}
                      onCheckedChange={() => toggleTopic(topic)}
                    />
                    <Label
                      htmlFor={topic}
                      className="text-sm font-medium cursor-pointer capitalize flex-1"
                    >
                      {topic.replace(/-/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Digest Preferences - Disabled in Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Digest Cadence</CardTitle>
              <CardDescription>Email updates (available with an account)</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="grid md:grid-cols-3 gap-4 opacity-50">
                  {[
                    { value: 'instant', label: 'Instant', desc: 'Real-time notifications' },
                    { value: 'daily', label: 'Daily', desc: 'One email per day' },
                    { value: 'weekly', label: 'Weekly', desc: 'Every Monday morning' }
                  ].map(option => (
                    <Tooltip key={option.value}>
                      <TooltipTrigger asChild>
                        <button
                          disabled
                          className={`
                            p-4 rounded-lg border-2 transition-all text-left cursor-not-allowed
                            ${cadence === option.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border'
                            }
                          `}
                        >
                          <h3 className="font-semibold text-foreground">{option.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{option.desc}</p>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create an account to receive emails</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
