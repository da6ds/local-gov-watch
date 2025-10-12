import { CaliforniaDistrictMapping } from '@/types/districts';

/**
 * California district mappings for major cities
 * This data is current as of 2025
 * 
 * Sources:
 * - CA State Senate: https://www.senate.ca.gov/senators
 * - CA State Assembly: https://www.assembly.ca.gov/assemblymembers
 * - US Congress: https://www.house.gov/representatives
 */
export const CALIFORNIA_DISTRICTS: CaliforniaDistrictMapping[] = [
  // Marin County cities (for North Bay expansion)
  {
    city: 'San Rafael',
    county: 'Marin County',
    cityDistrict: 2,
    stateSenateDistrict: 3,
    stateAssemblyDistrict: 10,
    congressionalDistrict: 2,
    stateSenator: 'Bill Dodd',
    assemblyMember: 'Damon Connolly',
    congressionalRep: 'Jared Huffman'
  },
  {
    city: 'Novato',
    county: 'Marin County',
    stateSenateDistrict: 3,
    stateAssemblyDistrict: 10,
    congressionalDistrict: 2,
    stateSenator: 'Bill Dodd',
    assemblyMember: 'Damon Connolly',
    congressionalRep: 'Jared Huffman'
  },
  
  // Sonoma County cities
  {
    city: 'Santa Rosa',
    county: 'Sonoma County',
    cityDistrict: 1,
    stateSenateDistrict: 3,
    stateAssemblyDistrict: 4,
    congressionalDistrict: 2,
    stateSenator: 'Bill Dodd',
    assemblyMember: 'Cecilia Aguiar-Curry',
    congressionalRep: 'Jared Huffman'
  },
  {
    city: 'Petaluma',
    county: 'Sonoma County',
    stateSenateDistrict: 3,
    stateAssemblyDistrict: 10,
    congressionalDistrict: 2,
    stateSenator: 'Bill Dodd',
    assemblyMember: 'Damon Connolly',
    congressionalRep: 'Jared Huffman'
  },
  
  // Napa County
  {
    city: 'Napa',
    county: 'Napa County',
    stateSenateDistrict: 3,
    stateAssemblyDistrict: 4,
    congressionalDistrict: 4,
    stateSenator: 'Bill Dodd',
    assemblyMember: 'Cecilia Aguiar-Curry',
    congressionalRep: 'Mike Thompson'
  }
];

/**
 * Look up district information for a California city
 */
export const getCaliforniaDistricts = (
  city: string,
  county?: string,
  cityDistrict?: number
): CaliforniaDistrictMapping | null => {
  const match = CALIFORNIA_DISTRICTS.find(d => {
    const cityMatch = d.city.toLowerCase() === city.toLowerCase();
    const countyMatch = !county || d.county.toLowerCase() === county.toLowerCase();
    const districtMatch = !cityDistrict || !d.cityDistrict || d.cityDistrict === cityDistrict;
    
    return cityMatch && countyMatch && districtMatch;
  });
  
  return match || null;
};

/**
 * Check if a location is in California
 */
export const isCaliforniaLocation = (state?: string, county?: string): boolean => {
  if (state) {
    return state.toLowerCase().includes('california') || state === 'CA';
  }
  
  if (county) {
    const caCounties = ['marin', 'sonoma', 'napa', 'solano', 'san francisco'];
    return caCounties.some(c => county.toLowerCase().includes(c));
  }
  
  return false;
};
