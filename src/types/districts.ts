export interface DistrictInfo {
  // Local districts
  cityDistrict?: number | string;
  cityDistrictName?: string;
  countyDistrict?: number | string;
  countyDistrictName?: string;
  
  // State districts
  stateSenateDistrict?: number;
  stateAssemblyDistrict?: number;
  
  // Federal districts
  congressionalDistrict?: number;
  
  // Representative info
  stateSenator?: string;
  assemblyMember?: string;
  congressionalRep?: string;
}

export interface CaliforniaDistrictMapping {
  city: string;
  county: string;
  cityDistrict?: number;
  stateSenateDistrict: number;
  stateAssemblyDistrict: number;
  congressionalDistrict: number;
  stateSenator?: string;
  assemblyMember?: string;
  congressionalRep?: string;
}
