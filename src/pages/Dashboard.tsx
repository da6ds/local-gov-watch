import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, FileText } from "lucide-react";
import { TrendsWidget } from "@/components/TrendsWidget";

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">What's changed this week in local government</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="civic-card">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>New legislation and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">in the last 7 days</p>
              <Button variant="link" asChild className="mt-2 p-0">
                <Link to="/browse/legislation">View all legislation →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="civic-card">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Next 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">meetings scheduled</p>
              <Button variant="link" asChild className="mt-2 p-0">
                <Link to="/calendar">View calendar →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="civic-card">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Upcoming Elections</CardTitle>
              <CardDescription>Next 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">elections upcoming</p>
              <Button variant="link" asChild className="mt-2 p-0">
                <Link to="/browse/elections">View elections →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <TrendsWidget />

        <div className="bg-muted/30 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Get Started</h2>
          <p className="text-muted-foreground mb-4">
            Data ingestion hasn't started yet. Admin users can configure sources and run the first ingestion.
          </p>
          <Button asChild>
            <Link to="/browse/legislation">Browse Available Data</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}