import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocationFilter } from '@/contexts/LocationFilterContext';
import { getGuestTopics } from '@/lib/guestSessionStorage';

export function useFilteredLegislation(options?: {
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}) {
  const { jurisdictionIds } = useLocationFilter();
  
  return useQuery({
    queryKey: ['filtered-legislation', jurisdictionIds, options],
    queryFn: async () => {
      let query = supabase
        .from('legislation')
        .select('*, jurisdiction(*)')
        .in('jurisdiction_id', jurisdictionIds);
      
      if (options?.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.ascending ?? false 
        });
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: jurisdictionIds.length > 0,
  });
}

export function useFilteredMeetings(options?: {
  limit?: number;
  upcoming?: boolean;
}) {
  const { jurisdictionIds } = useLocationFilter();
  
  return useQuery({
    queryKey: ['filtered-meetings', jurisdictionIds, options],
    queryFn: async () => {
      let query = supabase
        .from('meeting')
        .select('*, jurisdiction(*)')
        .in('jurisdiction_id', jurisdictionIds);
      
      if (options?.upcoming) {
        query = query.gte('starts_at', new Date().toISOString());
      }
      
      // Order by most recent first (desc) to show latest meetings
      query = query.order('starts_at', { 
        ascending: false 
      });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: jurisdictionIds.length > 0,
  });
}

export function useFilteredDashboardData() {
  const { jurisdictionIds, selectedLocationSlugs } = useLocationFilter();
  
  console.log('🔍 Dashboard Data Query:', {
    selectedLocations: selectedLocationSlugs,
    jurisdictionIds: jurisdictionIds,
    count: jurisdictionIds.length
  });
  
  return useQuery({
    queryKey: ['filtered-dashboard', jurisdictionIds],
    queryFn: async () => {
      console.log('📊 Fetching dashboard data for jurisdiction IDs:', jurisdictionIds);
      
      // Fetch recent legislation (for "Recent Updates" section)
      const { data: legislation, error: legError } = await supabase
        .from('legislation')
        .select('*, jurisdiction(*)')
        .in('jurisdiction_id', jurisdictionIds)
        .order('introduced_at', { ascending: false })
        .limit(6);
      
      if (legError) {
        console.error('Dashboard legislation query error:', legError);
        throw legError;
      }
      
      // Fetch upcoming meetings (for "Upcoming Meetings" section)
      const { data: meetings, error: meetError } = await supabase
        .from('meeting')
        .select('*, jurisdiction(*)')
        .in('jurisdiction_id', jurisdictionIds)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
      
      if (meetError) {
        console.error('Dashboard meetings query error:', meetError);
        throw meetError;
      }
      
      console.log('✅ Dashboard data fetched:', {
        legislationCount: legislation?.length,
        meetingsCount: meetings?.length
      });
      
      return {
        legislation: legislation || [],
        meetings: meetings || [],
        elections: []
      };
    },
    enabled: jurisdictionIds.length > 0,
  });
}

export function useFilteredTrendingTopics(limit = 8) {
  const { jurisdictionIds } = useLocationFilter();
  
  return useQuery({
    queryKey: ['filtered-trending-topics', jurisdictionIds, limit],
    queryFn: async () => {
      // Fetch recent legislation for trending analysis
      const { data: legislation, error: legError } = await supabase
        .from('legislation')
        .select('tags')
        .in('jurisdiction_id', jurisdictionIds)
        .gte('introduced_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);
      
      if (legError) throw legError;
      
      // Fetch recent meetings for trending analysis
      const { data: meetings, error: meetError } = await supabase
        .from('meeting')
        .select('extracted_text')
        .in('jurisdiction_id', jurisdictionIds)
        .gte('starts_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);
      
      if (meetError) throw meetError;
      
      // Aggregate tag frequencies
      const tagCounts: Record<string, number> = {};
      legislation?.forEach(item => {
        item.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      // Return top N topics with correct structure
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([topic, count]) => ({ 
          keyword: topic,
          relatedItemCount: count,
          topic, 
          count,
          percentage: 0
        }));
    },
    enabled: jurisdictionIds.length > 0,
  });
}
