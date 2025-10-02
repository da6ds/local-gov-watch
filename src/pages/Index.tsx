import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { startGuestSession, isGuest } = useAuth();
  const navigate = useNavigate();

  // Fetch live snapshot data
  const { data: snapshotData, isLoading } = useQuery({
    queryKey: ['landing-snapshot'],
    queryFn: async () => {
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-status`);
      url.searchParams.set('scope', 'city:austin-tx,county:travis-county-tx,state:texas');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
        }
      });

      if (!response.ok) return null;
      return await response.json();
    },
    staleTime: 60000 // 1 minute
  });

  const handleTryDemo = async () => {
    if (!isGuest) {
      await startGuestSession();
    }
    navigate("/dashboard");
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 py-16 md:py-24 max-w-[1320px] mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance max-w-5xl">
          Local government, at a glance
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl text-balance">
          Pick a place. See meetings, laws, and elections—fast.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Works wherever data is available across the U.S.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button 
            size="lg" 
            onClick={handleTryDemo} 
            className="text-lg px-8 py-6"
          >
            Try demo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          Explore: <Link to="/browse/legislation" className="text-primary hover:underline">Legislation</Link> • <Link to="/calendar" className="text-primary hover:underline">Calendar</Link> • <Link to="/browse/elections" className="text-primary hover:underline">Elections</Link>
        </p>
      </div>

      {/* Live Snapshot */}
      <div className="max-w-[1320px] mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>New this week</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Elections</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>New this week</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{snapshotData?.tableCounts?.legislation || 0}</p>
                  <p className="text-sm text-muted-foreground">Recent legislation</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{snapshotData?.tableCounts?.meetings || 0}</p>
                  <p className="text-sm text-muted-foreground">Total in database</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Elections</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{snapshotData?.tableCounts?.elections || 0}</p>
                  <p className="text-sm text-muted-foreground">Total in database</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
