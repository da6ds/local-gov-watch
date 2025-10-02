import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getGuestScope } from "@/lib/guestSessionStorage";

export default function Index() {
  const { startGuestSession } = useAuth();
  const navigate = useNavigate();

  // Fetch live snapshot data
  const scopeSlugs = getGuestScope();
  const scope = scopeSlugs.map(slug => {
    // Determine type based on slug pattern
    if (slug.includes('county')) return `county:${slug}`;
    if (slug.endsWith('tx') && !slug.includes('-')) return `state:${slug}`;
    return `city:${slug}`;
  }).join(',');
  
  const { data: snapshotData, isLoading } = useQuery({
    queryKey: ['landing-snapshot', scope],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('data-status', {
        body: { scope }
      });

      if (error) throw error;
      return data;
    },
  });

  const handleTryDemo = async () => {
    await startGuestSession();
    navigate('/dashboard');
  };

  const counts = snapshotData?.tableCounts || { meetings: 0, legislation: 0, elections: 0 };

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Local government, at a glance.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Pick a place. See meetings, laws, and elections—fast.
            </p>
            <p className="text-sm text-muted-foreground">
              Works wherever data is available across the U.S.
            </p>
          </div>

          {/* Primary CTA */}
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 h-auto"
            onClick={handleTryDemo}
          >
            Try demo
          </Button>

          {/* Quick Links */}
          <div className="flex gap-4 text-sm">
            <Link to="/browse/legislation" className="text-primary hover:underline">
              Legislation
            </Link>
            <Link to="/calendar" className="text-primary hover:underline">
              Calendar
            </Link>
            <Link to="/browse/elections" className="text-primary hover:underline">
              Elections
            </Link>
          </div>
        </div>

        {/* Live Snapshot */}
        <div className="border-t bg-muted/30">
          <div className="container py-12 max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Live Snapshot
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* New this week */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">New this week</h3>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold">{counts.legislation || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Legislation items
                  </p>
                </CardContent>
              </Card>

              {/* Meetings */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Meetings</h3>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold">{counts.meetings || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Upcoming in 14 days
                  </p>
                </CardContent>
              </Card>

              {/* Elections */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Elections</h3>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold">{counts.elections || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Next 90 days
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Data from Austin, Travis County, and Texas
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
