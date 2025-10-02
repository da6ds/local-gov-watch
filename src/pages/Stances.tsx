import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, Eye, XCircle, Info, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getAllStances, type StanceType } from "@/lib/stanceStorage";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useDemoUser } from "@/hooks/useDemoUser";
import { DemoLoginDialog } from "@/components/DemoLoginDialog";

interface LegislationWithStance {
  id: string;
  title: string;
  status: string | null;
  jurisdiction: { name: string } | null;
  introduced_at: string | null;
  stance: StanceType;
  stanceTimestamp: string;
}

export default function Stances() {
  const { isLoggedIn } = useDemoUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [stances, setStances] = useState(getAllStances());
  const legislationIds = stances.map(s => s.legislationId);

  const { data: legislationData, isLoading } = useQuery({
    queryKey: ['stances-legislation', legislationIds],
    queryFn: async () => {
      if (legislationIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('legislation')
        .select(`
          id,
          title,
          status,
          introduced_at,
          jurisdiction:jurisdiction_id (name)
        `)
        .in('id', legislationIds);
      
      if (error) throw error;
      return data;
    },
    enabled: legislationIds.length > 0
  });

  const legislationWithStances: LegislationWithStance[] = stances
    .map(stance => {
      const legislation = legislationData?.find(l => l.id === stance.legislationId);
      if (!legislation) return null;
      
      return {
        ...legislation,
        stance: stance.stance,
        stanceTimestamp: stance.timestamp
      };
    })
    .filter((item): item is LegislationWithStance => item !== null);

  const stanceCounts = {
    support: legislationWithStances.filter(l => l.stance === 'support').length,
    oppose: legislationWithStances.filter(l => l.stance === 'oppose').length,
    watching: legislationWithStances.filter(l => l.stance === 'watching').length,
    unimportant: legislationWithStances.filter(l => l.stance === 'unimportant').length,
  };

  const getStanceIcon = (stance: StanceType) => {
    switch (stance) {
      case 'support': return ThumbsUp;
      case 'oppose': return ThumbsDown;
      case 'watching': return Eye;
      case 'unimportant': return XCircle;
      default: return Info;
    }
  };

  const getStanceColor = (stance: StanceType) => {
    switch (stance) {
      case 'support': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'oppose': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'watching': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'unimportant': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
      default: return '';
    }
  };

  const getStanceLabel = (stance: StanceType) => {
    switch (stance) {
      case 'support': return 'Supporting';
      case 'oppose': return 'Opposing';
      case 'watching': return 'Watching';
      case 'unimportant': return 'Unimportant';
      default: return '';
    }
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
        <Button variant="outline" asChild className="mt-4">
          <Link to="/browse/legislation">Browse Legislation</Link>
        </Button>
      </div>
    </Card>
  );

  const renderLegislationCard = (item: LegislationWithStance) => {
    const StanceIcon = getStanceIcon(item.stance);
    
    return (
      <Link key={item.id} to={`/legislation/${item.id}`}>
        <Card className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`gap-1 ${getStanceColor(item.stance)}`}>
                      <StanceIcon className="h-3 w-3" />
                      {getStanceLabel(item.stance)}
                    </Badge>
                    {item.status && (
                      <Badge variant="secondary">{item.status}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {item.jurisdiction && <span>{item.jurisdiction.name}</span>}
                {item.introduced_at && (
                  <>
                    <span>•</span>
                    <span>Introduced {format(new Date(item.introduced_at), 'MMM d, yyyy')}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">My Stances</h1>
            <p className="text-muted-foreground">
              Track and manage your positions on local legislation
            </p>
          </div>

          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Try the Demo to Use This Feature</h3>
                <p className="text-muted-foreground text-sm">
                  Start a demo session to track your stances on legislation. Your data will be saved for this browser session only.
                </p>
              </div>
              <Button onClick={() => setShowLoginDialog(true)} className="mt-4 gap-2">
                <Sparkles className="h-4 w-4" />
                Start Demo
              </Button>
            </div>
          </Card>
        </div>
        <DemoLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Stances</h1>
          <p className="text-muted-foreground">
            Track and manage your positions on local legislation
          </p>
        </div>

        {legislationIds.length > 0 && (
          <Card className="bg-muted/50 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Demo Mode: Temporary Data</p>
                  <p className="text-xs text-muted-foreground">
                    Stances are saved for this session only. Your data will clear when you end the demo or close this tab. 
                    Email subscriptions (digests and alerts) are permanent and email-based.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="support" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
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
            <TabsTrigger value="unimportant" className="gap-2">
              <XCircle className="h-4 w-4" />
              Unimportant
              {stanceCounts.unimportant > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stanceCounts.unimportant}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="support" className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : stanceCounts.support === 0 ? (
              <EmptyState
                icon={ThumbsUp}
                title="No supported legislation yet"
                description="When you support legislation, it will appear here so you can track its progress."
              />
            ) : (
              <div className="space-y-3">
                {legislationWithStances
                  .filter(item => item.stance === 'support')
                  .map(renderLegislationCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="oppose" className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : stanceCounts.oppose === 0 ? (
              <EmptyState
                icon={ThumbsDown}
                title="No opposed legislation yet"
                description="When you oppose legislation, it will appear here so you can monitor updates."
              />
            ) : (
              <div className="space-y-3">
                {legislationWithStances
                  .filter(item => item.stance === 'oppose')
                  .map(renderLegislationCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watching" className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : stanceCounts.watching === 0 ? (
              <EmptyState
                icon={Eye}
                title="Not watching any legislation yet"
                description="Track important legislation without taking a public stance."
              />
            ) : (
              <div className="space-y-3">
                {legislationWithStances
                  .filter(item => item.stance === 'watching')
                  .map(renderLegislationCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unimportant" className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : stanceCounts.unimportant === 0 ? (
              <EmptyState
                icon={XCircle}
                title="No items marked as unimportant"
                description="Mark legislation as unimportant to hide it from your main views."
              />
            ) : (
              <div className="space-y-3">
                {legislationWithStances
                  .filter(item => item.stance === 'unimportant')
                  .map(renderLegislationCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
