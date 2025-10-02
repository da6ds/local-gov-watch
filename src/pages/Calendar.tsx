import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { CalendarView } from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScopeSelector } from "@/components/ScopeSelector";
import { useAuth } from "@/hooks/useAuth";
import { useLiveDataStatus } from "@/hooks/useLiveDataStatus";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getGuestSessionId, getGuestProfile } from "@/lib/guestSession";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface CalendarEvent {
  id: string;
  kind: 'meeting' | 'election';
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  bodyName: string | null;
  jurisdiction: string;
  detailUrl: string;
}

export default function Calendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial state from URL params or defaults
  const [scope, setScope] = useState<'city' | 'county' | 'state'>(() => {
    return (searchParams.get('defaultScope') as 'city' | 'county' | 'state') || 'city';
  });
  
  const [selectedKinds, setSelectedKinds] = useState<Set<string>>(() => {
    const kindsParam = searchParams.get('kinds');
    return new Set(kindsParam ? kindsParam.split(',') : ['meetings', 'elections']);
  });
  
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(addDays(new Date(), 60)), // 2 months
  });

  // Fetch user or guest profile for jurisdiction
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (user) {
        const { data } = await supabase
          .from('profile')
          .select('*, selected_jurisdiction:jurisdiction!profile_selected_jurisdiction_id_fkey(id, slug, name, type)')
          .eq('id', user.id)
          .single();
        return data;
      } else {
        const sessionId = getGuestSessionId();
        if (sessionId) {
          const guestProfile = await getGuestProfile(sessionId);
          if (guestProfile?.selectedJurisdictionId) {
            const { data } = await supabase
              .from('jurisdiction')
              .select('id, slug, name, type')
              .eq('id', guestProfile.selectedJurisdictionId)
              .single();
            return data ? { selected_jurisdiction: data, default_scope: guestProfile.defaultScope } : null;
          }
        }
      }
      return null;
    },
  });

  // Build jurisdiction slugs based on scope
  const jurisdictionSlugs = (() => {
    if (!profile?.selected_jurisdiction) return [];
    
    const jurisdiction = profile.selected_jurisdiction;
    const effectiveScope = searchParams.get('defaultScope') || profile.default_scope || scope;
    
    // Austin hierarchy: austin-tx (city), travis-county-tx (county), texas (state)
    if (jurisdiction.slug === 'austin-tx') {
      if (effectiveScope === 'city') return ['austin-tx'];
      if (effectiveScope === 'county') return ['austin-tx', 'travis-county-tx'];
      if (effectiveScope === 'state') return ['austin-tx', 'travis-county-tx', 'texas'];
    }
    
    return [jurisdiction.slug];
  })();

  const { data: liveDataStatus } = useLiveDataStatus(jurisdictionSlugs);

  // Fetch calendar events
  const { data: events = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', dateRange, jurisdictionSlugs, selectedKinds],
    queryFn: async () => {
      const scopeParam = jurisdictionSlugs.map(slug => {
        if (slug === 'austin-tx') return 'city:austin-tx';
        if (slug === 'travis-county-tx') return 'county:travis-county-tx';
        if (slug === 'texas') return 'state:texas';
        return slug;
      }).join(',');

      const sessionId = getGuestSessionId();
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        scope: scopeParam,
        kinds: Array.from(selectedKinds).join(','),
        ...(sessionId && !user ? { session_id: sessionId } : {}),
      });

      const { data, error } = await supabase.functions.invoke('calendar-api', {
        body: {},
        method: 'GET',
      });

      if (error) throw error;

      // Fetch manually since edge function invoke doesn't support query params properly
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-api?${params}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch calendar events');
      }

      return response.json();
    },
    enabled: jurisdictionSlugs.length > 0,
  });

  const handleExportICS = async () => {
    try {
      const scopeParam = jurisdictionSlugs.map(slug => {
        if (slug === 'austin-tx') return 'city:austin-tx';
        if (slug === 'travis-county-tx') return 'county:travis-county-tx';
        if (slug === 'texas') return 'state:texas';
        return slug;
      }).join(',');

      const sessionId = getGuestSessionId();
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        scope: scopeParam,
        kinds: Array.from(selectedKinds).join(','),
        format: 'ics',
        ...(sessionId && !user ? { session_id: sessionId } : {}),
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-api?${params}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to export calendar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Calendar exported",
        description: "Your calendar file has been downloaded",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleKind = (kind: string) => {
    const newKinds = new Set(selectedKinds);
    if (newKinds.has(kind)) {
      newKinds.delete(kind);
    } else {
      newKinds.add(kind);
    }
    setSelectedKinds(newKinds);
  };

  const handleScopeChange = (newScope: 'city' | 'county' | 'state') => {
    setScope(newScope);
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('defaultScope', newScope);
    setSearchParams(newParams);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendar</h1>
            <p className="text-muted-foreground">
              Meetings and elections timeline
              {profile?.selected_jurisdiction && (
                <> for {profile.selected_jurisdiction.name}</>
              )}
            </p>
          </div>
          <ScopeSelector value={scope} onChange={handleScopeChange} />
        </div>

        {/* Live Data Status */}
        {liveDataStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            liveDataStatus.hasLiveData 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-yellow-500/10 border border-yellow-500/20'
          }`}>
            {liveDataStatus.hasLiveData ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Live data as of {liveDataStatus.lastRunAt && format(new Date(liveDataStatus.lastRunAt), 'MMM d, h:mm a')}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">
                  Showing sample data{liveDataStatus.reason && ` - ${liveDataStatus.reason}`}
                </span>
              </>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedKinds.has('meetings') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleKind('meetings')}
          >
            Meetings
            {selectedKinds.has('meetings') && events && (
              <Badge variant="secondary" className="ml-2">
                {events.filter(e => e.kind === 'meeting').length}
              </Badge>
            )}
          </Button>
          <Button
            variant={selectedKinds.has('elections') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleKind('elections')}
          >
            Elections
            {selectedKinds.has('elections') && events && (
              <Badge variant="secondary" className="ml-2">
                {events.filter(e => e.kind === 'election').length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Calendar View */}
        {eventsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px]" />
          </div>
        ) : (
          <CalendarView
            events={events}
            onExportICS={handleExportICS}
            isLoading={eventsLoading}
          />
        )}
      </div>
    </Layout>
  );
}
