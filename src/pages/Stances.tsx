import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Eye, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Stances() {
  // Placeholder data structure for when feature is live
  const stanceCounts = {
    support: 0,
    oppose: 0,
    watching: 0,
  };

  const EmptyState = ({ 
    icon: Icon, 
    title, 
    description 
  }: { 
    icon: typeof ThumbsUp; 
    title: string; 
    description: string;
  }) => (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex flex-col items-center gap-3 mt-4 p-6 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-5 w-5" />
            <span className="font-medium">Login Required</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Track your positions on legislation by signing in or creating an account
          </p>
          <Button className="gap-2" asChild>
            <Link to="/auth">
              Sign In to Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Stances</h1>
          <p className="text-muted-foreground">
            Track and manage your positions on local legislation
          </p>
        </div>

        <Tabs defaultValue="support" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="support" className="gap-2">
              <ThumbsUp className="h-4 w-4" />
              Support
              {stanceCounts.support > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stanceCounts.support}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="oppose" className="gap-2">
              <ThumbsDown className="h-4 w-4" />
              Oppose
              {stanceCounts.oppose > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stanceCounts.oppose}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="watching" className="gap-2">
              <Eye className="h-4 w-4" />
              Watching
              {stanceCounts.watching > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stanceCounts.watching}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="support" className="mt-6">
            <EmptyState
              icon={ThumbsUp}
              title="No supported legislation yet"
              description="When you support legislation, it will appear here so you can track its progress and take action."
            />
          </TabsContent>

          <TabsContent value="oppose" className="mt-6">
            <EmptyState
              icon={ThumbsDown}
              title="No opposed legislation yet"
              description="When you oppose legislation, it will appear here so you can monitor updates and engage with the process."
            />
          </TabsContent>

          <TabsContent value="watching" className="mt-6">
            <EmptyState
              icon={Eye}
              title="Not watching any legislation yet"
              description="Track important legislation without taking a public stance. You'll get updates as it moves through the process."
            />
          </TabsContent>
        </Tabs>

        {/* Preview of what cards will look like when feature is live */}
        <Card className="p-6 border-dashed opacity-60">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    Supporting
                  </Badge>
                  <Badge variant="secondary">In Committee</Badge>
                </div>
                <h3 className="font-semibold">Example Legislation Title</h3>
                <p className="text-sm text-muted-foreground">
                  This is a preview of how legislation cards will appear when you take stances on items...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Austin, TX</span>
              <span>•</span>
              <span>Last updated 2 days ago</span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
