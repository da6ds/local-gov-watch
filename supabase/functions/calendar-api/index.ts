import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Rate limiting for guests
const guestRateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const limit = guestRateLimits.get(sessionId);
  
  if (!limit || now > limit.resetAt) {
    guestRateLimits.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  limit.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const scope = url.searchParams.get('scope') || '';
    const kinds = url.searchParams.get('kinds') || 'meetings,elections';
    const format = url.searchParams.get('format'); // 'ics' for ICS export
    const sessionId = url.searchParams.get('session_id') || '';

    // Rate limiting for guests
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes('Bearer') && sessionId) {
      if (!checkRateLimit(sessionId)) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!start || !end) {
      return new Response(
        JSON.stringify({ error: 'start and end parameters are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse scope into jurisdiction slugs
    const jurisdictionSlugs = scope.split(',').map(s => {
      const parts = s.split(':');
      return parts[1] || parts[0];
    }).filter(Boolean);

    const includeKinds = kinds.split(',');
    const events: CalendarEvent[] = [];

    // Fetch meetings if requested
    if (includeKinds.includes('meetings')) {
      let meetingQuery = supabase
        .from('meeting')
        .select(`
          id,
          title,
          body_name,
          starts_at,
          ends_at,
          location,
          jurisdiction:jurisdiction_id(slug)
        `)
        .gte('starts_at', start)
        .lt('starts_at', end)
        .order('starts_at', { ascending: true })
        .limit(500);

      if (jurisdictionSlugs.length > 0) {
        const { data: jurisdictions } = await supabase
          .from('jurisdiction')
          .select('id')
          .in('slug', jurisdictionSlugs);
        
        if (jurisdictions && jurisdictions.length > 0) {
          const jurisdictionIds = jurisdictions.map(j => j.id);
          meetingQuery = meetingQuery.in('jurisdiction_id', jurisdictionIds);
        }
      }

      const { data: meetings, error: meetingError } = await meetingQuery;

      if (meetingError) {
        console.error('Error fetching meetings:', meetingError);
      } else if (meetings) {
        for (const meeting of meetings) {
          // Default to 2 hours if no end time
          const endTime = meeting.ends_at || 
            new Date(new Date(meeting.starts_at).getTime() + 2 * 60 * 60 * 1000).toISOString();
          
          events.push({
            id: meeting.id,
            kind: 'meeting',
            title: meeting.title || 'Untitled Meeting',
            start: meeting.starts_at,
            end: endTime,
            allDay: false,
            location: meeting.location,
            bodyName: meeting.body_name,
            jurisdiction: (meeting.jurisdiction as any)?.slug || '',
            detailUrl: `/meetings/${meeting.id}`,
          });
        }
      }
    }

    // Fetch elections if requested
    if (includeKinds.includes('elections')) {
      let electionQuery = supabase
        .from('election')
        .select(`
          id,
          name,
          date,
          kind,
          jurisdiction:jurisdiction_id(slug)
        `)
        .gte('date', start.split('T')[0])
        .lt('date', end.split('T')[0])
        .order('date', { ascending: true })
        .limit(500);

      if (jurisdictionSlugs.length > 0) {
        const { data: jurisdictions } = await supabase
          .from('jurisdiction')
          .select('id')
          .in('slug', jurisdictionSlugs);
        
        if (jurisdictions && jurisdictions.length > 0) {
          const jurisdictionIds = jurisdictions.map(j => j.id);
          electionQuery = electionQuery.in('jurisdiction_id', jurisdictionIds);
        }
      }

      const { data: elections, error: electionError } = await electionQuery;

      if (electionError) {
        console.error('Error fetching elections:', electionError);
      } else if (elections) {
        for (const election of elections) {
          events.push({
            id: election.id,
            kind: 'election',
            title: election.name,
            start: `${election.date}T00:00:00Z`,
            end: `${election.date}T23:59:59Z`,
            allDay: true,
            location: null,
            bodyName: null,
            jurisdiction: (election.jurisdiction as any)?.slug || '',
            detailUrl: `/elections/${election.id}`,
          });
        }
      }
    }

    // Sort events by start date
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Return ICS format if requested
    if (format === 'ics') {
      const icsContent = generateICS(events);
      return new Response(icsContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="calendar.ics"',
        },
      });
    }

    // Return JSON format
    return new Response(JSON.stringify(events), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Calendar API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateICS(events: CalendarEvent[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Civic Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : startDate;
    
    const dtstart = event.allDay
      ? `DTSTART;VALUE=DATE:${startDate.toISOString().split('T')[0].replace(/-/g, '')}`
      : `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    
    const dtend = event.allDay
      ? `DTEND;VALUE=DATE:${endDate.toISOString().split('T')[0].replace(/-/g, '')}`
      : `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${event.id}@civic-calendar`);
    ics.push(`DTSTAMP:${now}`);
    ics.push(dtstart);
    ics.push(dtend);
    ics.push(`SUMMARY:${event.title.replace(/,/g, '\\,')}`);
    
    if (event.location) {
      ics.push(`LOCATION:${event.location.replace(/,/g, '\\,')}`);
    }
    
    if (event.bodyName) {
      ics.push(`DESCRIPTION:${event.bodyName.replace(/,/g, '\\,')}`);
    }
    
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}
