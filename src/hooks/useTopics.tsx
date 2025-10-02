import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Topic {
  slug: string;
  label: string;
}

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async (): Promise<Topic[]> => {
      const { data, error } = await supabase.functions.invoke('topics');
      
      if (error) {
        console.error('Error fetching topics:', error);
        // Return fallback topics if API fails
        return [
          { slug: 'zoning', label: 'Zoning & Land Use' },
          { slug: 'short-term-rentals', label: 'Short-Term Rentals' },
          { slug: 'budget', label: 'Budget & Finance' },
          { slug: 'water', label: 'Water & Conservation' },
          { slug: 'transportation', label: 'Transportation' },
          { slug: 'housing', label: 'Housing & Homelessness' },
          { slug: 'environment', label: 'Environment & Climate' },
          { slug: 'parks', label: 'Parks & Recreation' },
          { slug: 'police', label: 'Police & Public Safety' },
          { slug: 'fire', label: 'Fire & Emergency Services' },
          { slug: 'taxes', label: 'Taxes & Revenue' },
        ];
      }
      
      return data || [];
    },
    staleTime: Infinity, // Topics rarely change
  });
}
