import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  generateGuestSessionId, 
  getGuestSessionId, 
  setGuestSessionId, 
  createGuestProfile,
  clearGuestSession,
  getGuestProfile,
  GuestSession
} from "@/lib/guestSession";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  guestSession: GuestSession | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  startGuestSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // User logged in, clear guest session
          setIsGuest(false);
          setGuestSession(null);
          clearGuestSession();
        } else {
          // Check for guest session
          const guestId = getGuestSessionId();
          if (guestId) {
            const profile = await getGuestProfile(guestId);
            if (profile) {
              setIsGuest(true);
              setGuestSession(profile);
            }
          }
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        // Check for guest session
        const guestId = getGuestSessionId();
        if (guestId) {
          const profile = await getGuestProfile(guestId);
          if (profile) {
            setIsGuest(true);
            setGuestSession(profile);
          }
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully");
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! You can now sign in.");
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearGuestSession();
    setIsGuest(false);
    setGuestSession(null);
    toast.success("Signed out successfully");
  };

  const startGuestSession = async () => {
    const sessionId = generateGuestSessionId();
    setGuestSessionId(sessionId);
    // Create with default Austin/Travis/Texas setup
    await createGuestProfile(sessionId, true);
    const profile = await getGuestProfile(sessionId);
    setIsGuest(true);
    setGuestSession(profile);
    toast.success("Demo started with Austin & Travis County data");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isGuest, 
      guestSession,
      signIn, 
      signUp, 
      signOut,
      startGuestSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}