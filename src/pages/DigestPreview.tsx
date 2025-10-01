import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GuestBanner } from "@/components/GuestBanner";
import { Link } from "react-router-dom";
import { Mail, Calendar, FileText } from "lucide-react";

export default function DigestPreview() {
  return (
    <>
      <GuestBanner />
      <Layout>
        <div className="container max-w-3xl mx-auto py-12 px-4">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Preview Your Weekly Digest</h1>
              <p className="text-muted-foreground">
                This is what you'd receive via email every week
              </p>
            </div>

            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Weekly Austin Civic Digest
                </CardTitle>
                <CardDescription>Week of January 27, 2025</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    New Legislation (2 items)
                  </h3>
                  <div className="space-y-3">
                    <div className="pl-6 border-l-2 border-primary/20">
                      <p className="font-medium text-sm">Sample Ordinance - Zoning Changes</p>
                      <p className="text-sm text-muted-foreground">
                        Updates to residential zoning requirements in District 3
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded">zoning</span>
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded">housing</span>
                      </div>
                    </div>
                    <div className="pl-6 border-l-2 border-primary/20">
                      <p className="font-medium text-sm">Budget Amendment - Public Transit</p>
                      <p className="text-sm text-muted-foreground">
                        Proposed increase in transit funding for 2025
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded">budget</span>
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded">transportation</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Meetings (2 items)
                  </h3>
                  <div className="space-y-3">
                    <div className="pl-6 border-l-2 border-primary/20">
                      <p className="font-medium text-sm">City Council Regular Session</p>
                      <p className="text-sm text-muted-foreground">
                        Thursday, January 30, 2025 at 10:00 AM
                      </p>
                    </div>
                    <div className="pl-6 border-l-2 border-primary/20">
                      <p className="font-medium text-sm">Planning Commission Meeting</p>
                      <p className="text-sm text-muted-foreground">
                        Tuesday, February 4, 2025 at 6:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an account to receive real digests based on your topics and preferences
                  </p>
                  <Button asChild>
                    <Link to="/auth?convert=true">Enable Email Alerts</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="outline" asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
