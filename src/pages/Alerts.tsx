import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationSelector } from "@/components/LocationSelector";
import { InteractiveTopicChips } from "@/components/InteractiveTopicChips";
import { EmailPreviewDialog } from "@/components/EmailPreviewDialog";
import { TrackedTermsSummary } from "@/components/tracked-terms/TrackedTermsSummary";
import { CreateTrackedTermDialog } from "@/components/tracked-terms/CreateTrackedTermDialog";
import { useTopics } from "@/hooks/useTopics";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Bell, Plus, AlertCircle, Mail, Target, TestTube, Eye, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
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
      <div className="space-y-3">
        {/* Compact Demo Mode Banner */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          Demo Mode - Settings saved for this session only
        </div>

        {/* Header with Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-xl font-bold">Alert Settings</h1>
            <div className="flex items-center gap-2">
              <LocationSelector
                value={selectedLocations}
                onChange={handleLocationChange}
              />
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="md:ml-auto" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Tracked Term
          </Button>
        </div>

        {/* Email Setup (if not filled) */}
        {!watchedEmail && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Get Started with Alerts</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="your.email@example.com"
                  {...register('email')}
                />
                <Input
                  placeholder="Your name"
                  {...register('name')}
                />
              </div>
              {(errors.email || errors.name) && (
                <p className="text-sm text-destructive mt-2">
                  {errors.email?.message || errors.name?.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Required for email alerts and digest delivery
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            size="lg"
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Target className="w-6 h-6" />
            <span className="text-sm">Add Tracked Term</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setIsDigestOpen(!isDigestOpen)}
          >
            <Mail className="w-6 h-6" />
            <span className="text-sm">Setup Digest</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={handleSendTest}
            disabled={isSendingTest || !isValid}
          >
            {isSendingTest ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <TestTube className="w-6 h-6" />
            )}
            <span className="text-sm">Send Test Alert</span>
          </Button>
        </div>

        {/* Instant Alerts Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Instant Alerts</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Immediate notifications when keywords match
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/tracked-terms')}
            >
              Manage Terms
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <TrackedTermsSummary
              onManageTerms={() => navigate('/tracked-terms')}
              onAddTerm={() => setIsCreateDialogOpen(true)}
            />
          </CardContent>
        </Card>

        {/* Digest Settings (Collapsed) */}
        <Collapsible open={isDigestOpen} onOpenChange={setIsDigestOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">Weekly Digest</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Summary emails of activity in your areas
                  </CardDescription>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDigestOpen ? 'rotate-180' : ''}`} />
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="border-t-0 rounded-t-none">
              <CardContent className="pt-4 space-y-3">
                {/* Locations */}
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

                {/* Topics */}
                <div className="space-y-2">
                  <Label>Topics of Interest (Optional)</Label>
                  <InteractiveTopicChips
                    topics={topicsData}
                    selectedTopics={selectedTopics}
                    onToggle={handleToggleTopic}
                    onClear={handleClearTopics}
                  />
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label>Delivery Frequency</Label>
                  <RadioGroup
                    value={watchedCadence}
                    onValueChange={(value) => setValue('cadence', value as 'daily' | 'weekly' | 'biweekly')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly" className="font-normal cursor-pointer">
                        Weekly (Recommended)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="font-normal cursor-pointer">
                        Daily
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

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || !isValid}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      'Subscribe to Digest'
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
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Dialogs */}
      <CreateTrackedTermDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Layout>
  );
}
