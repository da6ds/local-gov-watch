import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getGuestScope, setGuestScope } from '@/lib/guestSessionStorage';
import { expandJurisdictionSlugs } from '@/lib/jurisdictionHelpers';

interface Jurisdiction {
  id: string;
  slug: string;
  name: string;
  type: 'state' | 'county' | 'city' | 'district';
  parent_jurisdiction_id?: string;
}

interface LocationFilterContextType {
  selectedLocationSlugs: string[];
  setSelectedLocations: (slugs: string[]) => void;
  jurisdictionIds: string[];
  jurisdictions: Jurisdiction[];
  hasActiveFilter: boolean;
  isLoading: boolean;
}

const LocationFilterContext = createContext<LocationFilterContextType | undefined>(undefined);

export function LocationFilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jurisdictionIds, setJurisdictionIds] = useState<string[]>([]);
  
  // Read selected locations from guest scope (persists across navigation)
  const guestScope = getGuestScope();
  const selectedLocationSlugs = guestScope;
  
  // Fetch all jurisdictions
  const { data: jurisdictions = [], isLoading: isLoadingJurisdictions } = useQuery({
    queryKey: ['jurisdictions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jurisdiction')
        .select('id, slug, name, type, parent_jurisdiction_id')
        .order('name');
      
      if (error) throw error;
      return data as Jurisdiction[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // Compute filtered jurisdiction IDs using hierarchical logic
  useEffect(() => {
    if (selectedLocationSlugs.length === 0 || jurisdictions.length === 0) {
      // No filter = return all jurisdiction IDs
      setJurisdictionIds(jurisdictions.map(j => j.id));
      return;
    }
    
    const fetchExpandedIds = async () => {
      const expandedIds = await expandJurisdictionSlugs(selectedLocationSlugs);
      setJurisdictionIds(expandedIds);
    };
    
    fetchExpandedIds();
  }, [selectedLocationSlugs, jurisdictions]);
  
  const setSelectedLocations = (slugs: string[]) => {
    setGuestScope(slugs);
    // Force re-render by updating search params (optional, for URL persistence)
    const newParams = new URLSearchParams(searchParams);
    if (slugs.length > 0) {
      newParams.set('locations', slugs.join(','));
    } else {
      newParams.delete('locations');
    }
    setSearchParams(newParams, { replace: true });
  };
  
  return (
    <LocationFilterContext.Provider
      value={{
        selectedLocationSlugs,
        setSelectedLocations,
        jurisdictionIds,
        jurisdictions,
        hasActiveFilter: selectedLocationSlugs.length > 0,
        isLoading: isLoadingJurisdictions || jurisdictionIds.length === 0,
      }}
    >
      {children}
    </LocationFilterContext.Provider>
  );
}

export function useLocationFilter() {
  const context = useContext(LocationFilterContext);
  if (!context) {
    throw new Error('useLocationFilter must be used within LocationFilterProvider');
  }
  return context;
}
