import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, Edit, Trash2, MapPin, Tag, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface TrackedTermsListProps {
  email: string;
}

export function TrackedTermsList({ email }: TrackedTermsListProps) {
  const { data: terms, isLoading, refetch } = useQuery({
    queryKey: ['tracked-terms', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracked_term')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!email,
  });

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('tracked_term')
      .update({ active: !currentValue })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update term");
    } else {
      toast.success(currentValue ? "Term paused" : "Term activated");
      refetch();
    }
  };

  const handleToggleAlert = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('tracked_term')
      .update({ alert_enabled: !currentValue })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update alert settings");
    } else {
      toast.success(currentValue ? "Alerts disabled" : "Alerts enabled");
      refetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tracked term?")) return;

    const { error } = await supabase
      .from('tracked_term')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete term");
    } else {
      toast.success("Term deleted");
      refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!terms || terms.length === 0) {
    return (
      <Card className="p-8 md:p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No tracked terms yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Create your first tracked term to monitor keywords in new legislation and get alerts
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {terms.map((term) => {
        const jurisdictions = term.jurisdictions as string[];
        const keywords = term.keywords as string[];
        const displayKeywords = keywords.slice(0, 3);
        const remainingKeywords = keywords.length - 3;

        return (
          <Card key={term.id} className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-semibold">{term.name}</h3>
                  {term.match_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {term.match_count} new matches
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`active-${term.id}`}
                      checked={term.active}
                      onCheckedChange={() => handleToggleActive(term.id, term.active)}
                    />
                    <Label htmlFor={`active-${term.id}`} className="text-sm cursor-pointer">
                      {term.active ? "Active" : "Paused"}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {displayKeywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {remainingKeywords > 0 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{remainingKeywords} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Locations */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  {jurisdictions.slice(0, 2).join(", ")}
                  {jurisdictions.length > 2 && ` +${jurisdictions.length - 2} more`}
                </div>
              </div>

              {/* Alert Toggle */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when new matches are found
                  </p>
                </div>
                <Switch
                  id={`alert-${term.id}`}
                  checked={term.alert_enabled}
                  onCheckedChange={() => handleToggleAlert(term.id, term.alert_enabled)}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/tracked-terms/${term.id}/matches`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Matches
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(term.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
