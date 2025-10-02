import { createContext, useContext, useEffect, useState } from 'react';
import { 
  generateGuestSessionId,
  getGuestSessionId, 
  setGuestSessionId, 
  createGuestProfile,
  getGuestProfile,
  GuestSession
} from '@/lib/guestSession';

interface AuthContextType {
  user: null;
  session: null;
  loading: boolean;
  isGuest: boolean;
  guestSession: GuestSession | null;
  startGuestSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    // Auto-create guest session on first visit
    const initGuestSession = async () => {
      let guestId = getGuestSessionId();
      if (!guestId) {
        guestId = generateGuestSessionId();
        setGuestSessionId(guestId);
        await createGuestProfile(guestId, true);
      }
      const profile = await getGuestProfile(guestId);
      if (profile) {
        setIsGuest(true);
        setGuestSession(profile);
      }
      setLoading(false);
    };

    initGuestSession();
  }, []);

  const startGuestSession = async () => {
    const sessionId = generateGuestSessionId();
    setGuestSessionId(sessionId);
    await createGuestProfile(sessionId, true);
    const profile = await getGuestProfile(sessionId);
    setIsGuest(true);
    setGuestSession(profile);
  };

  const value = {
    user: null,
    session: null,
    loading,
    isGuest,
    guestSession,
    startGuestSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
