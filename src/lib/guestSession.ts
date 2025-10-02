import { supabase } from "@/integrations/supabase/client";

export interface GuestSession {
  sessionId: string;
  userRole?: string;
  selectedJurisdictionId?: string;
  defaultScope?: string;
  topics?: string[];
}

const GUEST_SESSION_KEY = 'guest_session_id';

export function generateGuestSessionId(): string {
  return `guest_${crypto.randomUUID()}`;
}

export function getGuestSessionId(): string | null {
  return localStorage.getItem(GUEST_SESSION_KEY);
}

export function setGuestSessionId(sessionId: string): void {
  localStorage.setItem(GUEST_SESSION_KEY, sessionId);
}

export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_SESSION_KEY);
}

export async function createGuestProfile(sessionId: string, defaultSetup: boolean = false): Promise<void> {
  // Get Austin jurisdiction ID for default setup
  let austinId = null;
  if (defaultSetup) {
    const { data: austin } = await supabase
      .from('jurisdiction')
      .select('id')
      .eq('slug', 'austin-tx')
      .eq('type', 'city')
      .single();
    austinId = austin?.id;
  }

  const { error } = await supabase
    .from('guest_profile')
    .insert({
      session_id: sessionId,
      user_role: defaultSetup ? 'resident' : null,
      selected_jurisdiction_id: austinId,
      default_scope: 'city',
      topics: defaultSetup ? ['housing', 'transportation', 'budget', 'environment'] : []
    });

  if (error && error.code !== '23505') { // Ignore duplicate key errors
    console.error('Error creating guest profile:', error);
    throw error;
  }
}

export async function updateGuestProfile(sessionId: string, updates: Partial<GuestSession>): Promise<void> {
  const data: any = {
    last_active_at: new Date().toISOString()
  };

  if (updates.userRole !== undefined) {
    data.user_role = updates.userRole;
  }
  if (updates.selectedJurisdictionId !== undefined) {
    data.selected_jurisdiction_id = updates.selectedJurisdictionId;
  }
  if (updates.defaultScope !== undefined) {
    data.default_scope = updates.defaultScope;
  }
  if (updates.topics !== undefined) {
    data.topics = updates.topics;
  }

  const { error } = await supabase
    .from('guest_profile')
    .update(data)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error updating guest profile:', error);
    throw error;
  }
}

export async function getGuestProfile(sessionId: string): Promise<GuestSession | null> {
  const { data, error } = await supabase
    .from('guest_profile')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    return null;
  }

  return {
    sessionId: data.session_id,
    userRole: data.user_role,
    selectedJurisdictionId: data.selected_jurisdiction_id,
    defaultScope: data.default_scope,
    topics: data.topics
  };
}
