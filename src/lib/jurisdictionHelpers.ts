import { supabase } from "@/integrations/supabase/client";

interface Jurisdiction {
  id: string;
  slug: string;
  type: string;
  parent_jurisdiction_id: string | null;
}

/**
 * Expands jurisdiction slugs hierarchically
 * If a state is selected, includes all counties and cities within that state
 * If a county is selected, includes all cities within that county
 */
export async function expandJurisdictionSlugs(slugs: string[]): Promise<string[]> {
  if (!slugs || slugs.length === 0) return [];

  // Fetch all jurisdictions
  const { data: allJurisdictions } = await supabase
    .from('jurisdiction')
    .select('id, slug, type, parent_jurisdiction_id');

  if (!allJurisdictions) return [];

  const jurisdictions = allJurisdictions as Jurisdiction[];
  const expanded = new Set<string>();

  // Process each selected slug
  for (const slug of slugs) {
    const jurisdiction = jurisdictions.find(j => j.slug === slug);
    if (!jurisdiction) continue;

    // Always include the selected jurisdiction itself
    expanded.add(jurisdiction.id);

    // If it's a state, include all counties and cities in that state
    if (jurisdiction.type === 'state') {
      jurisdictions
        .filter(j => j.parent_jurisdiction_id === jurisdiction.id)
        .forEach(j => {
          expanded.add(j.id);
          // Also include cities within those counties
          jurisdictions
            .filter(city => city.parent_jurisdiction_id === j.id)
            .forEach(city => expanded.add(city.id));
        });
    }

    // If it's a county, include all cities in that county
    if (jurisdiction.type === 'county') {
      jurisdictions
        .filter(j => j.parent_jurisdiction_id === jurisdiction.id)
        .forEach(j => expanded.add(j.id));
    }
  }

  return Array.from(expanded);
}

/**
 * Get jurisdiction IDs from slugs (without hierarchical expansion)
 */
export async function getJurisdictionIds(slugs: string[]): Promise<string[]> {
  if (!slugs || slugs.length === 0) return [];

  const { data } = await supabase
    .from('jurisdiction')
    .select('id')
    .in('slug', slugs);

  return data?.map(j => j.id) || [];
}
