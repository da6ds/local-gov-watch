import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface RelatedMeetingsProps {
  currentMeetingId: string;
  bodyName?: string;
  startsAt: string;
}

export function RelatedMeetings({ currentMeetingId, bodyName, startsAt }: RelatedMeetingsProps) {
  const { data: previousMeeting } = useQuery({
    queryKey: ['previous-meeting', currentMeetingId, bodyName],
    queryFn: async () => {
      if (!bodyName) return null;
      
      const { data } = await supabase
        .from('meeting')
        .select('id, title, starts_at')
        .eq('body_name', bodyName)
        .lt('starts_at', startsAt)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!bodyName
  });

  const { data: nextMeeting } = useQuery({
    queryKey: ['next-meeting', currentMeetingId, bodyName],
    queryFn: async () => {
      if (!bodyName) return null;
      
      const { data } = await supabase
        .from('meeting')
        .select('id, title, starts_at')
        .eq('body_name', bodyName)
        .gt('starts_at', startsAt)
        .order('starts_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!bodyName
  });

  if (!previousMeeting && !nextMeeting) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Related Meetings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {previousMeeting && (
          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <Link to={`/meetings/${previousMeeting.id}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">Previous</span>
                <span className="font-medium truncate w-full">{previousMeeting.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(previousMeeting.starts_at), "MMM d, yyyy")}
                </span>
              </div>
            </Link>
          </Button>
        )}

        {nextMeeting && (
          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <Link to={`/meetings/${nextMeeting.id}`}>
              <ChevronRight className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">Next</span>
                <span className="font-medium truncate w-full">{nextMeeting.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(nextMeeting.starts_at), "MMM d, yyyy")}
                </span>
              </div>
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
