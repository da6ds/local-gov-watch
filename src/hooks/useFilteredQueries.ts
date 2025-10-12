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
      
      query = query.order('starts_at', { 
        ascending: options?.upcoming ?? true 
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
  const { jurisdictionIds } = useLocationFilter();
  const topicsParam = getGuestTopics().join(',');
  
  return useQuery({
    queryKey: ['filtered-dashboard', jurisdictionIds, topicsParam],
    queryFn: async () => {
      // Build scope string for dashboard API
      const { data: jurisdictionData } = await supabase
        .from('jurisdiction')
        .select('slug, type')
        .in('id', jurisdictionIds);
      
      if (!jurisdictionData) {
        return { legislation: [], meetings: [], elections: [] };
      }
      
      const scopeParts = jurisdictionData.map(j => `${j.type}:${j.slug}`);
      const scopeString = scopeParts.join(',');
      
      const { data, error } = await supabase.functions.invoke('dashboard-api', {
        body: { scope: scopeString, topics: topicsParam }
      });

      if (error) throw error;
      return data || { legislation: [], meetings: [], elections: [] };
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
