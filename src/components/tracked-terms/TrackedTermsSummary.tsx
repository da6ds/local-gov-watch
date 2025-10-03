import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Target } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllTrackedTerms, updateTrackedTerm, TrackedTerm } from "@/lib/trackedTermStorage";

interface TrackedTermsSummaryProps {
  onManageTerms: () => void;
  onAddTerm: () => void;
}

export function TrackedTermsSummary({ onManageTerms, onAddTerm }: TrackedTermsSummaryProps) {
  const queryClient = useQueryClient();
  
  const { data: terms = [] } = useQuery<TrackedTerm[]>({
    queryKey: ['tracked-terms-session'],
    queryFn: getAllTrackedTerms,
    staleTime: 0,
  });

  const handleToggleAlert = (termId: string, currentState: boolean) => {
    const term = terms.find(t => t.id === termId);
    if (term) {
      updateTrackedTerm(termId, { alertEnabled: !currentState });
      queryClient.invalidateQueries({ queryKey: ['tracked-terms-session'] });
    }
  };

  if (terms.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium mb-1">No tracked terms yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first tracked term to monitor keywords in legislation and meetings
        </p>
        <Button size="sm" onClick={onAddTerm}>
          Add Tracked Term
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {terms.slice(0, 3).map(term => (
        <div key={term.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm mb-1">{term.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {term.keywords.slice(0, 3).join(', ')}
              {term.keywords.length > 3 && ` +${term.keywords.length - 3} more`}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {term.matchCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {term.matchCount} {term.matchCount === 1 ? 'match' : 'matches'}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={term.alertEnabled}
                onCheckedChange={() => handleToggleAlert(term.id, term.alertEnabled)}
              />
              <span className="text-xs text-muted-foreground hidden md:inline">
                {term.alertEnabled ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      ))}
      {terms.length > 3 && (
        <Button variant="outline" size="sm" className="w-full" onClick={onManageTerms}>
          View All {terms.length} Terms
        </Button>
      )}
    </div>
  );
}
