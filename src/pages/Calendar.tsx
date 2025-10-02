import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { CalendarView } from "@/components/CalendarView";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Download, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { getGuestScope, getGuestTopics } from "@/lib/guestSessionStorage";
import { InteractiveTopicChips } from "@/components/InteractiveTopicChips";
import { useTopics } from "@/hooks/useTopics";
import { useQueryClient } from "@tanstack/react-query";

export default function Calendar() {
  const queryClient = useQueryClient();
  const { data: availableTopics = [] } = useTopics();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showMeetings, setShowMeetings] = useState(true);
  const [showElections, setShowElections] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Initialize topics from session
  useEffect(() => {
    setSelectedTopics(getGuestTopics());
  }, []);

  const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd'T'HH:mm:ss'Z'");

  const scopeString = getGuestScope().join(',');
  const kinds = [
    ...(showMeetings ? ['meetings'] : []),
    ...(showElections ? ['elections'] : []),
  ].join(',');

  const topicsParam = selectedTopics.join(',');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', monthStart, monthEnd, scopeString, kinds, topicsParam],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calendar-api', {
        body: {
          start: monthStart,
          end: monthEnd,
          scope: scopeString,
          kinds: kinds,
          topics: topicsParam,
        },
      });

      if (error) {
        console.error('Calendar API error:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!scopeString && kinds.length > 0,
  });

  const toggleTopic = (slug: string) => {
    const updated = selectedTopics.includes(slug)
      ? selectedTopics.filter(t => t !== slug)
      : [...selectedTopics, slug];
    setSelectedTopics(updated);
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  };

  const clearTopics = () => {
    setSelectedTopics([]);
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  };

  const handleExportCalendar = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-api', {
        body: {
          start: format(startOfMonth(selectedDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          end: format(endOfMonth(selectedDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          scope: scopeString,
          kinds: kinds,
          topics: topicsParam,
          format: 'ics',
        },
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-${format(selectedDate, 'yyyy-MM')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Calendar exported!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export calendar");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header - visible on mobile only */}
        <div className="md:hidden">
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-muted-foreground">View upcoming meetings and elections</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Left side - Filters on mobile/tablet, Calendar on desktop */}
          <div className="lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Type Filters */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Event Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="meetings"
                        checked={showMeetings}
                        onCheckedChange={(checked) => setShowMeetings(checked as boolean)}
                      />
                      <Label htmlFor="meetings" className="text-sm">Meetings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="elections"
                        checked={showElections}
                        onCheckedChange={(checked) => setShowElections(checked as boolean)}
                      />
                      <Label htmlFor="elections" className="text-sm">Elections</Label>
                    </div>
                  </div>
                </div>

                {/* Topic Filters */}
                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-sm font-medium">Filter by Topics</h4>
                  <InteractiveTopicChips
                    topics={availableTopics}
                    selectedTopics={selectedTopics}
                    onToggle={toggleTopic}
                    onClear={clearTopics}
                    showClear={true}
                  />
                  {selectedTopics.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Showing events matching {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Export */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleExportCalendar}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export .ics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Calendar with side panel for event details */}
          <div className="lg:order-1">
            <MiniCalendar scope={scopeString} showSidePanel={true} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
