import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationSelector } from "@/components/LocationSelector";
import { InteractiveTopicChips } from "@/components/InteractiveTopicChips";
import { DigestEmailPreview } from "@/components/DigestEmailPreview";
import { EmailPreviewDialog } from "@/components/EmailPreviewDialog";
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
      toast.error("Please fill in all required fields", {
        description: "Email, name, and at least one location are required."
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address", {
        description: "Please enter a valid email address."
      });
      return;
    }

    setIsSendingTest(true);
    console.log('[Digest] Sending test email:', {
      email: `${email.substring(0, 3)}***`,
      locationsCount: locations.length,
      topicsCount: selectedTopics.length,
      cadence: watchedCadence
    });

    try {
      const { data, error } = await supabase.functions.invoke('send-digest-email', {
        body: {
          email: email.trim(),
          name: name.trim(),
          locations,
          topics: selectedTopics.length > 0 ? selectedTopics : null,
          cadence: watchedCadence,
          test: true,
        },
      });

      console.log('[Digest] Response:', { data, error });

      if (error) {
        console.error('[Digest] Supabase function error:', error);
        throw error;
      }

      // Check if response contains an error from the edge function
      if (data && typeof data === 'object' && 'error' in data) {
        const errorCode = (data as any).code || 'UNKNOWN_ERROR';
        const errorDetails = (data as any).details;
        
        console.error('[Digest] Edge function returned error:', {
          code: errorCode,
          error: data.error,
          details: errorDetails
        });

        const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.INTERNAL_ERROR;
        
        toast.error(errorMessage.title, {
          description: errorMessage.description
        });
        return;
      }

      console.log('[Digest] Test email sent successfully');
      toast.success(`Test email sent to ${email}!`, {
        description: "Check your inbox. It may take a minute to arrive."
      });
    } catch (error) {
      console.error('[Digest] Caught error:', error);
      
      // Handle network errors
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error("Network error", {
          description: "Please check your internet connection and try again."
        });
        return;
      }

      // Default error
      toast.error("Failed to send test email", {
        description: "Please try again or contact support if the issue persists."
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const onSubmit = async (data: DigestFormValues) => {
    console.log('[Digest] Submitting subscription:', {
      email: `${data.email.substring(0, 3)}***`,
      locationsCount: data.locations.length,
      topicsCount: data.topics?.length || 0,
      cadence: data.cadence
    });

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
        console.error('[Digest] Subscription insert error:', error);
        
        // Check for duplicate email
        if (error.code === '23505') {
          toast.error("Already subscribed", {
            description: "This email is already subscribed. Check your inbox for confirmation."
          });
          return;
        }
        
        throw error;
      }

      console.log('[Digest] Subscription created successfully');
      toast.success("You're subscribed!", {
        description: "Check your email for confirmation. Your first digest will arrive on the next scheduled day."
      });

      // Reset form
      reset();
      setSelectedLocations([]);
      setSelectedTopics([]);
    } catch (error) {
      console.error('[Digest] Subscription error:', error);
      toast.error("Failed to subscribe", {
        description: "Please try again or contact support if the issue persists."
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
              <div className="space-y-3">
                {/* Preview Button */}
                <EmailPreviewDialog
                  name={watchedName}
                  locations={selectedLocations}
                  topics={selectedTopics}
                  cadence={watchedCadence}
                  disabled={selectedLocations.length === 0}
                />
                
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
                
                <p className="text-xs text-muted-foreground text-center">
                  Preview lets you see the email without sending. Test sends to your inbox.
                </p>
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
