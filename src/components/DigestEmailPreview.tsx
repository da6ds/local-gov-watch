import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, FileText, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { getPreviewLegislation, getPreviewMeetings, getPreviewTrends } from "@/lib/digestPreviewQueries";

interface DigestEmailPreviewProps {
  locations: string[];
  topics: string[];
  userName: string;
  cadence: 'daily' | 'weekly' | 'biweekly';
}

export function DigestEmailPreview({ locations, topics, userName, cadence }: DigestEmailPreviewProps) {
  const { data: legislation, isLoading: legislationLoading } = useQuery({
    queryKey: ['digest-preview-legislation', locations, topics],
    queryFn: () => getPreviewLegislation(locations, topics),
    enabled: locations.length > 0,
  });

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ['digest-preview-meetings', locations, topics],
    queryFn: () => getPreviewMeetings(locations, topics),
    enabled: locations.length > 0,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['digest-preview-trends', locations, topics],
    queryFn: () => getPreviewTrends(locations, topics),
    enabled: locations.length > 0,
  });

  if (locations.length === 0) {
    return (
      <Card className="text-center p-12 border-dashed bg-muted/30">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Select locations to preview</h3>
        <p className="text-sm text-muted-foreground">
          Choose one or more locations above to see a sample digest
        </p>
      </Card>
    );
  }

  const cadenceText = cadence === 'daily' ? 'Daily' : cadence === 'weekly' ? 'Weekly' : 'Bi-weekly';
  const locationText = locations.length > 1 ? `${locations.length} locations` : locations[0].replace(/-/g, ' ');
  const isLoading = legislationLoading || meetingsLoading || trendsLoading;

  const hasData = (legislation && legislation.length > 0) || 
                  (meetings && meetings.length > 0) || 
                  (trends && trends.length > 0);

  return (
    <Card className="max-w-2xl mx-auto bg-background border-2">
      <CardHeader className="border-b bg-muted/30">
        <div className="text-xs text-muted-foreground mb-2">Preview Your Digest</div>
        <CardTitle className="text-xl">
          Your {cadenceText} Local Gov Digest - {locationText}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Greeting */}
        <div>
          <p className="text-base">Hi {userName || 'there'},</p>
          <p className="text-sm text-muted-foreground mt-2">
            Here's what's happening in local government {topics.length > 0 ? `related to ${topics.length > 1 ? 'your selected topics' : topics[0]}` : 'in your area'}.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !hasData ? (
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              No recent activity in selected areas. You'll receive updates when new items are published.
            </p>
          </div>
        ) : (
          <>
            {/* Recent Legislation */}
            {legislation && legislation.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base">Recent Legislation</h3>
                </div>
                <div className="space-y-4">
                  {legislation.map((item) => (
                    <div key={item.id} className="border-l-2 border-primary/30 pl-4 py-2">
                      <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.jurisdictionName} • {item.introduced_at && format(new Date(item.introduced_at), 'MMM d, yyyy')}
                      </p>
                      {(item.ai_summary || item.summary) && (
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {item.ai_summary || item.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Meetings */}
            {meetings && meetings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base">Upcoming Meetings</h3>
                </div>
                <div className="space-y-4">
                  {meetings.map((item) => (
                    <div key={item.id} className="border-l-2 border-primary/30 pl-4 py-2">
                      <h4 className="font-medium text-sm mb-1">{item.title || item.body_name}</h4>
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.jurisdictionName} • {format(new Date(item.starts_at), 'EEEE, MMM d, yyyy h:mm a')}
                      </p>
                      {item.ai_summary && (
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {item.ai_summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            {trends && trends.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base">Trending Topics</h3>
                </div>
                <div className="space-y-3">
                  {trends.map((trend, idx) => (
                    <div key={idx} className="bg-muted/50 rounded p-3">
                      <h4 className="font-medium text-sm mb-1 capitalize">{trend.topic.replace(/-/g, ' ')}</h4>
                      <p className="text-xs text-muted-foreground">
                        {trend.count} items • Score: {trend.score.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="border-t pt-4 text-xs text-muted-foreground">
          <p>You're receiving this digest because you subscribed to updates for {locationText}.</p>
        </div>
      </CardContent>
    </Card>
  );
}
