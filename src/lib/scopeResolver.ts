import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profile']['Row'];
type GuestProfile = Database['public']['Tables']['guest_profile']['Row'];

// Client-side types
interface ClientProfile {
  selected_jurisdiction_id?: string | null;
  default_scope?: string | null;
}

interface ClientGuestSession {
  selectedJurisdictionId?: string;
  defaultScope?: string;
}

export interface ResolvedScope {
  scopeString: string; // e.g., "city:austin-tx,county:travis-county-tx,state:texas"
  jurisdictionIds: string[];
  jurisdictionSlugs: string[];
}

/**
 * Resolve scope with precedence: URL params → user profile → guest profile → default Austin/Travis/Texas
 */
export async function resolveScope(
  urlParams?: URLSearchParams,
  user?: ClientProfile | null,
  guestSession?: ClientGuestSession | null,
  supabase?: any
): Promise<ResolvedScope> {
  // 1. Try URL params
  if (urlParams?.has('scope')) {
    const scopeString = urlParams.get('scope')!;
    return parseScopeString(scopeString, supabase);
  }

  // 2. Try user profile
  if (user?.selected_jurisdiction_id) {
    return resolveFromJurisdictionId(user.selected_jurisdiction_id, user.default_scope || 'city', supabase);
  }

  // 3. Try guest profile
  if (guestSession?.selectedJurisdictionId) {
    return resolveFromJurisdictionId(guestSession.selectedJurisdictionId, guestSession.defaultScope || 'city', supabase);
  }

  // 4. Default to Austin/Travis/Texas
  return {
    scopeString: 'city:austin-tx,county:travis-county-tx,state:texas',
    jurisdictionIds: [], // Will be resolved by edge function
    jurisdictionSlugs: ['austin-tx', 'travis-county-tx', 'texas']
  };
}

/**
 * Parse a scope string like "city:austin-tx,county:travis-county-tx" into slugs
 */
async function parseScopeString(scopeString: string, supabase?: any): Promise<ResolvedScope> {
  const parts = scopeString.split(',').map(s => s.trim());
  const slugs: string[] = [];
  
  for (const part of parts) {
    const match = part.match(/^(city|county|state):(.+)$/);
    if (match) {
      slugs.push(match[2]);
    }
  }

  return {
    scopeString,
    jurisdictionIds: [], // Will be resolved by edge function if needed
    jurisdictionSlugs: slugs
  };
}

/**
 * Resolve scope from a jurisdiction ID by fetching hierarchical jurisdictions
 */
async function resolveFromJurisdictionId(
  jurisdictionId: string,
  scope: string,
  supabase?: any
): Promise<ResolvedScope> {
  if (!supabase) {
    // Fallback if no supabase client provided
    return {
      scopeString: 'city:austin-tx,county:travis-county-tx,state:texas',
      jurisdictionIds: [jurisdictionId],
      jurisdictionSlugs: ['austin-tx', 'travis-county-tx', 'texas']
    };
  }

  const { data: jurisdiction } = await supabase
    .from('jurisdiction')
    .select('id, slug, type, parent_jurisdiction_id')
    .eq('id', jurisdictionId)
    .single();

  if (!jurisdiction) {
    return {
      scopeString: 'city:austin-tx,county:travis-county-tx,state:texas',
      jurisdictionIds: [],
      jurisdictionSlugs: ['austin-tx', 'travis-county-tx', 'texas']
    };
  }

  const jurisdictions = [jurisdiction];
  const slugs = [jurisdiction.slug];
  const ids = [jurisdiction.id];

  // Fetch parent jurisdictions based on scope
  if (scope === 'county' || scope === 'state') {
    if (jurisdiction.parent_jurisdiction_id) {
      const { data: parent } = await supabase
        .from('jurisdiction')
        .select('id, slug, type, parent_jurisdiction_id')
        .eq('id', jurisdiction.parent_jurisdiction_id)
        .single();
      
      if (parent) {
        jurisdictions.push(parent);
        slugs.push(parent.slug);
        ids.push(parent.id);

        // Fetch grandparent for state scope
        if (scope === 'state' && parent.parent_jurisdiction_id) {
          const { data: grandparent } = await supabase
            .from('jurisdiction')
            .select('id, slug, type')
            .eq('id', parent.parent_jurisdiction_id)
            .single();
          
          if (grandparent) {
            jurisdictions.push(grandparent);
            slugs.push(grandparent.slug);
            ids.push(grandparent.id);
          }
        }
      }
    }
  }

  // Build scope string with type prefixes
  const scopeParts = jurisdictions.map(j => `${j.type}:${j.slug}`);
  
  return {
    scopeString: scopeParts.join(','),
    jurisdictionIds: ids,
    jurisdictionSlugs: slugs
  };
}
