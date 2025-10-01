import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export function TrendsPlaceholder() {
  // Sample data for guest mode
  const sampleTrends = [
    {
      tag: "housing",
      count: 12,
      label: "Affordable Housing Initiatives",
      summary: "Multiple proposals addressing housing affordability across Austin districts"
    },
    {
      tag: "transportation",
      count: 8,
      label: "Public Transit Expansion",
      summary: "Updates to bus routes and bike lane infrastructure projects"
    },
    {
      tag: "zoning",
      count: 6,
      label: "Zoning Code Amendments",
      summary: "Proposed changes to residential and commercial zoning regulations"
    }
  ];

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Week's Trends
            </CardTitle>
            <CardDescription>
              Popular topics in Austin civic governance
            </CardDescription>
          </div>
          <Badge variant="secondary">Sample Data</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sampleTrends.map((trend) => (
          <div key={trend.tag} className="pb-4 border-b last:border-0 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-primary/10 rounded text-sm font-medium capitalize">
                  {trend.tag}
                </span>
                <span className="text-sm text-muted-foreground">
                  {trend.count} items
                </span>
              </div>
            </div>
            <h4 className="font-semibold text-sm mb-1">{trend.label}</h4>
            <p className="text-sm text-muted-foreground">{trend.summary}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Create an account to see real-time trends and get personalized insights
        </p>
      </CardContent>
    </Card>
  );
}
