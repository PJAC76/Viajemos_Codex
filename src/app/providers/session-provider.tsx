import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient } from "../../modules/auth/data/auth-client";
import type { AuthUser } from "../../modules/auth/domain/types";

interface SessionContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      async signInDemo() {
        const signedUser = await authClient.signInWithEmail();
        setUser(signedUser);
      },
      async signOut() {
        await authClient.signOut();
        setUser(null);
      }
    }),
    [loading, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}
