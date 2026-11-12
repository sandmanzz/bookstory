import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore, type Me } from './api';

interface AuthState {
  me: Me | null;
  loading: boolean;
  /** Bumps whenever entitlements may have changed, so lists refetch their access flags. */
  version: number;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  /** Replace the cached profile after an action that returns it (checkout, cancel, resume). */
  setMe: (me: Me) => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Guests are shown the trial offer too: it only becomes unavailable once the account has subscribed before. */
export function useTrialEligible(): boolean {
  const { me } = useAuth();
  return me ? me.trialEligible : true;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

/** The profile for the stored token, or null if there is no token or it has expired. */
async function fetchMe(): Promise<Me | null> {
  if (!tokenStore.get()) return null;
  try {
    return await api.me();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMeState] = useState<Me | null>(null);
  const [loading, setLoading] = useState(() => tokenStore.get() !== null);
  const [version, setVersion] = useState(0);

  const apply = useCallback((next: Me | null) => {
    setMeState(next);
    setLoading(false);
    setVersion((v) => v + 1);
  }, []);

  // Restore the session on first load. Only async callbacks touch state here.
  useEffect(() => {
    let live = true;
    if (tokenStore.get()) void fetchMe().then((next) => live && apply(next));
    return () => {
      live = false;
    };
  }, [apply]);

  const value = useMemo<AuthState>(
    () => ({
      me,
      loading,
      version,
      login: async (email, name) => {
        tokenStore.set((await api.login(email, name)).token);
        apply(await fetchMe());
      },
      logout: () => {
        tokenStore.set(null);
        apply(null);
      },
      setMe: apply,
    }),
    [me, loading, version, apply],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
