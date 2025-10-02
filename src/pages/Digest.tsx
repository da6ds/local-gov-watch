import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationSelector } from "@/components/LocationSelector";
import { InteractiveTopicChips } from "@/components/InteractiveTopicChips";
import { DigestEmailPreview } from "@/components/DigestEmailPreview";
import { useTopics } from "@/hooks/useTopics";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

const digestFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  locations: z.array(z.string()).min(1, "Please select at least one location"),
  topics: z.array(z.string()).optional(),
  cadence: z.enum(['daily', 'weekly', 'biweekly']).default('weekly'),
});

type DigestFormValues = z.infer<typeof digestFormSchema>;

export default function Digest() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const { data: topicsData = [] } = useTopics();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DigestFormValues>({
    resolver: zodResolver(digestFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      name: '',
      locations: [],
      topics: [],
      cadence: 'weekly',
    },
  });

  const watchedEmail = watch('email');
  const watchedName = watch('name');
  const watchedCadence = watch('cadence');

  const handleLocationChange = (slugs: string[]) => {
    setSelectedLocations(slugs);
    setValue('locations', slugs, { shouldValidate: true });
  };

  const handleToggleTopic = (slug: string) => {
    const updated = selectedTopics.includes(slug)
      ? selectedTopics.filter(t => t !== slug)
      : [...selectedTopics, slug];
    setSelectedTopics(updated);
    setValue('topics', updated);
  };

  const handleClearTopics = () => {
    setSelectedTopics([]);
    setValue('topics', []);
  };

  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTest = async () => {
    const email = watchedEmail;
    const name = watchedName;
    const locations = selectedLocations;

    if (!email || !name || locations.length === 0) {
      toast.error("Please fill in email, name, and select at least one location");
      return;
    }

    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-digest-email', {
        body: {
          email: email.trim(),
          name: name.trim(),
          locations,
          topics: selectedTopics.length > 0 ? selectedTopics : null,
          cadence: watchedCadence,
          test: true,
        },
      });

      if (error) throw error;

      toast.success(`Test email sent to ${email}!`, {
        description: "Check your inbox. It may take a minute to arrive."
      });
    } catch (error) {
      console.error('Test email error:', error);
      toast.error("Failed to send test email", {
        description: "Please try again or contact support."
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const onSubmit = async (data: DigestFormValues) => {
    try {
      const { error } = await supabase
        .from('digest_subscription')
        .insert({
          email: data.email.trim(),
          name: data.name.trim(),
          locations: data.locations,
          topics: data.topics || null,
          cadence: data.cadence,
          active: true,
        });

      if (error) {
        throw error;
      }

      toast.success("You're subscribed!", {
        description: "Check your email for confirmation. Your first digest will arrive on the next scheduled day."
      });

      // Reset form
      reset();
      setSelectedLocations([]);
      setSelectedTopics([]);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error("Failed to subscribe", {
        description: "Please try again or contact support."
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Subscribe to Weekly Digests</h1>
          <p className="text-muted-foreground">
            Get personalized email updates about local government activity in your area
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Subscription Details
              </CardTitle>
              <CardDescription>
                Tell us where you want to receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    We'll send your digest to this email address
                  </p>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Locations *</Label>
                  <LocationSelector
                    value={selectedLocations}
                    onChange={handleLocationChange}
                    maxSelections={5}
                    placeholder="Select locations..."
                  />
                  {errors.locations && (
                    <p className="text-sm text-destructive">{errors.locations.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Topics (optional)</Label>
                  <InteractiveTopicChips
                    topics={topicsData}
                    selectedTopics={selectedTopics}
                    onToggle={handleToggleTopic}
                    onClear={handleClearTopics}
                    showClear={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to receive updates on all topics
                  </p>
                </div>
              </div>

              {/* Cadence */}
              <div className="space-y-3 pt-4 border-t">
                <Label>Frequency</Label>
                <RadioGroup
                  defaultValue="weekly"
                  onValueChange={(value) => setValue('cadence', value as 'daily' | 'weekly' | 'biweekly')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="font-normal cursor-pointer">
                      Daily (every morning at 8am)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="font-normal cursor-pointer">
                      Weekly (Monday mornings at 8am)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="biweekly" id="biweekly" />
                    <Label htmlFor="biweekly" className="font-normal cursor-pointer">
                      Bi-weekly (every other Monday at 8am)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={!watchedEmail || !watchedName || selectedLocations.length === 0 || isSendingTest}
                  className="flex-1"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Test Now"
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting || selectedLocations.length === 0}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe to Digest"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Preview Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Preview Your Digest</h2>
            <p className="text-sm text-muted-foreground">
              This is what your email digest will look like
            </p>
          </div>

          <DigestEmailPreview
            locations={selectedLocations}
            topics={selectedTopics}
            userName={watchedName || 'there'}
            cadence={watchedCadence}
          />
        </div>
      </div>
    </Layout>
  );
}
