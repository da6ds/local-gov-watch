import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function Unsubscribe() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link');
      return;
    }

    const unsubscribe = async () => {
      try {
        const { error } = await supabase
          .from('digest_subscription')
          .update({ active: false })
          .eq('unsubscribe_token', token);

        if (error) throw error;

        setStatus('success');
        setMessage("You've been successfully unsubscribed from our digest emails.");
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('Failed to unsubscribe. The link may be invalid or expired.');
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
              {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
              {status === 'loading' ? 'Unsubscribing...' : status === 'success' ? 'Unsubscribed' : 'Error'}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'success' && (
              <p className="text-sm text-muted-foreground">
                Sorry to see you go! You will no longer receive digest emails from us.
                If you change your mind, you can always subscribe again from our digest page.
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-muted-foreground">
                If you continue to have issues, please contact our support team.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
