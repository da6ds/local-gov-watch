import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Calendar, Star, TrendingUp, DollarSign, Zap } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { startGuestSession } = useAuth();
  const navigate = useNavigate();

  const handleTryNow = async () => {
    // Instant demo - no wizard, go straight to dashboard with default Austin scope
    await startGuestSession();
    navigate("/dashboard");
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 py-12 md:py-20">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
          <Scale className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-4xl">
          Track Local Government Like Never Before
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl text-balance">
          Live Austin & Travis County data. AI-powered insights. Zero signup required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            onClick={handleTryNow} 
            className="touch-target text-lg px-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            Try the demo — No signup
          </Button>
          <Button size="lg" variant="outline" asChild className="touch-target">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Or explore: <Link to="/browse/legislation" className="text-primary hover:underline">Legislation</Link> • <Link to="/calendar" className="text-primary hover:underline">Calendar</Link> • <Link to="/browse/elections" className="text-primary hover:underline">Elections</Link>
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 py-12">
        <Card className="civic-card">
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle>AI-Powered Insights</CardTitle>
            <CardDescription>
              Automatic summaries, smart tagging, and natural language search powered by AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ask questions like "What changed about zoning this week?" and get instant answers.
            </p>
          </CardContent>
        </Card>

        <Card className="civic-card">
          <CardHeader>
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Never Miss a Meeting</CardTitle>
            <CardDescription>
              Track city council, county commissioners, and state sessions in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get alerts for upcoming meetings and new legislation that matters to you.
            </p>
          </CardContent>
        </Card>

        <Card className="civic-card">
          <CardHeader>
            <Star className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Custom Watchlists</CardTitle>
            <CardDescription>
              Save searches and get email digests when tracked items update.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choose instant, daily, or weekly alerts to stay informed without the noise.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Why Section */}
      <div className="py-12 border-t">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Why Local Gov Watch?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <DollarSign className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Affordable</h3>
              <p className="text-sm text-muted-foreground">
                Under $100/month at MVP scale vs. $8k/month for Quorum.
              </p>
            </div>
            <div>
              <TrendingUp className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Hyper-Local</h3>
              <p className="text-sm text-muted-foreground">
                Built specifically for Austin, Travis County, and Texas—not bloated with federal data.
              </p>
            </div>
            <div>
              <Zap className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Fast & Simple</h3>
              <p className="text-sm text-muted-foreground">
                Mobile-first PWA with offline support. No complexity, just the info you need.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 text-center border-t">
        <h2 className="text-3xl font-bold mb-4">Get Started Today</h2>
        <p className="text-xl text-muted-foreground mb-6">
          Create an account to save watchlists and receive alerts.
        </p>
        <Button size="lg" asChild className="touch-target">
          <Link to="/auth">Sign Up for Free</Link>
        </Button>
      </div>
    </Layout>
  );
}
