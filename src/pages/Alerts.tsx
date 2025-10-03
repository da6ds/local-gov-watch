import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationSelector } from "@/components/LocationSelector";
import { InteractiveTopicChips } from "@/components/InteractiveTopicChips";
import { EmailPreviewDialog } from "@/components/EmailPreviewDialog";
import { TrackedTermsList } from "@/components/tracked-terms/TrackedTermsList";
import { CreateTrackedTermDialog } from "@/components/tracked-terms/CreateTrackedTermDialog";
import { useTopics } from "@/hooks/useTopics";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Bell, Plus, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const digestFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  locations: z.array(z.string()).min(1, "Please select at least one location"),
  topics: z.array(z.string()).optional(),
  cadence: z.enum(['daily', 'weekly', 'biweekly']).default('weekly'),
});

type DigestFormValues = z.infer<typeof digestFormSchema>;

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  MISSING_API_KEY: {
    title: 'Email service not configured',
    description: 'Please contact support to enable email functionality.'
  },
  DATA_FETCH_ERROR: {
    title: 'Unable to load digest data',
    description: 'There was an issue fetching your digest content. Please try again.'
  },
  INVALID_EMAIL_CONFIG: {
    title: 'Invalid email configuration',
    description: 'Please check your email address format and try again.'
  },
  AUTH_ERROR: {
    title: 'Email service authentication failed',
    description: 'Please contact support. Error code: AUTH_ERROR'
  },
  RATE_LIMIT: {
    title: 'Too many requests',
    description: 'Please wait a few minutes before trying again.'
  },
  DOMAIN_NOT_VERIFIED: {
    title: 'Email domain not verified',
    description: 'Please contact support to verify the sending domain.'
  },
  EMAIL_SEND_ERROR: {
    title: 'Failed to send email',
    description: 'Please try again or contact support if the issue persists.'
  },
  NETWORK_ERROR: {
    title: 'Unable to reach email service',
    description: 'Please check your connection and try again.'
  },
  INTERNAL_ERROR: {
    title: 'Something went wrong',
    description: 'Please try again or contact support if the issue persists.'
  }
};

export default function Alerts() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const handleToggleTopic = (topicSlug: string) => {
    const newTopics = selectedTopics.includes(topicSlug)
      ? selectedTopics.filter((slug) => slug !== topicSlug)
      : [...selectedTopics, topicSlug];
    setSelectedTopics(newTopics);
    setValue('topics', newTopics);
  };

  const handleClearTopics = () => {
    setSelectedTopics([]);
    setValue('topics', []);
  };

  const handleSendTest = async () => {
    if (!watchedEmail || !watchedName || selectedLocations.length === 0) {
      toast.error("Please fill in all required fields before sending a test");
      return;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('preview-digest-email', {
        body: {
          email: watchedEmail,
          userName: watchedName,
          locations: selectedLocations,
          topics: selectedTopics.length > 0 ? selectedTopics : undefined,
          cadence: watchedCadence,
        },
      });

      if (error) {
        const errorCode = error.message?.match(/Error: (\w+)/)?.[1] || 'INTERNAL_ERROR';
        const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.INTERNAL_ERROR;
        toast.error(errorInfo.title, {
          description: errorInfo.description,
        });
        return;
      }

      toast.success("Test email sent!", {
        description: `Check ${watchedEmail} for your test digest`,
      });
    } catch (error) {
      toast.error("Failed to send test email", {
        description: "Please try again or contact support",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const onSubmit = async (data: DigestFormValues) => {
    try {
      // For demo mode, just show success message
      // In production, this would save to digest_subscriptions table
      toast.success("Digest subscription saved!", {
        description: `You'll receive ${data.cadence} digests at ${data.email} (demo mode)`,
      });

      reset();
      setSelectedLocations([]);
      setSelectedTopics([]);
    } catch (error) {
      toast.error("Failed to create subscription", {
        description: "Please try again or contact support",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Alert Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage instant alerts and email digest preferences
          </p>
        </div>

        {/* Demo Mode Banner */}
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100">Demo Mode</AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Your alert settings are saved for this browser session only.
            <Button variant="link" className="p-0 h-auto ml-2 text-yellow-900 dark:text-yellow-100">
              Save Permanently
            </Button>
          </AlertDescription>
        </Alert>

        {/* Email Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Delivery
            </CardTitle>
            <CardDescription>
              Where should we send your alerts and digests?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Rob Miller"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instant Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Instant Alerts
            </CardTitle>
            <CardDescription>
              Get notified immediately when keywords match in new legislation or meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrackedTermsList />
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Tracked Term
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Digest Section */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Digest</CardTitle>
            <CardDescription>
              Summary of activity in your selected areas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Locations</Label>
              <LocationSelector
                value={selectedLocations}
                onChange={handleLocationChange}
              />
              {errors.locations && (
                <p className="text-sm text-destructive">{errors.locations.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Topics of Interest (Optional)</Label>
              <InteractiveTopicChips
                topics={topicsData}
                selectedTopics={selectedTopics}
                onToggle={handleToggleTopic}
                onClear={handleClearTopics}
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Frequency</Label>
              <RadioGroup
                value={watchedCadence}
                onValueChange={(value) => setValue('cadence', value as 'daily' | 'weekly' | 'biweekly')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="font-normal cursor-pointer">
                    Daily
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="font-normal cursor-pointer">
                    Weekly (Recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="biweekly" id="biweekly" />
                  <Label htmlFor="biweekly" className="font-normal cursor-pointer">
                    Bi-weekly
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Test & Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Test & Preview</CardTitle>
            <CardDescription>
              See what your emails will look like before subscribing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSendTest}
                disabled={isSendingTest || !isValid}
                variant="outline"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Alert
                  </>
                )}
              </Button>
              <EmailPreviewDialog
                name={watchedName}
                locations={selectedLocations}
                topics={selectedTopics}
                cadence={watchedCadence}
                disabled={!isValid}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscribe Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe to Digest'
            )}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <CreateTrackedTermDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Layout>
  );
}
