import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient } from "../../modules/auth/data/auth-client";
import type { AuthUser } from "../../modules/auth/domain/types";

interface SessionContextValue {
  user: AuthUser | null;
  loading: boolean;
  authMessage: string | null;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (payload: { email: string; password: string; name?: string }) => Promise<{ requiresEmailVerification: boolean }>;
  signInWithGoogle: () => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

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
      authMessage,
      async signInWithPassword(credentials) {
        const signedUser = await authClient.signInWithPassword(credentials);
        setUser(signedUser);
        setAuthMessage(null);
      },
      async signUp(payload) {
        const result = await authClient.signUp(payload);

        if (result.user && !result.requiresEmailVerification) {
          setUser(result.user);
        }

        setAuthMessage(
          result.requiresEmailVerification
            ? "Cuenta creada. Revisa tu correo para verificar el acceso."
            : "Cuenta creada correctamente."
        );

        return { requiresEmailVerification: result.requiresEmailVerification };
      },
      async signInWithGoogle() {
        const signedUser = await authClient.signInWithGoogle();
        setUser(signedUser);
      },
      async sendResetPasswordEmail(email) {
        await authClient.sendResetPasswordEmail(email);
        setAuthMessage("Te hemos enviado las instrucciones de recuperacion.");
      },
      async signInDemo() {
        const signedUser = await authClient.signInDemo();
        setUser(signedUser);
        setAuthMessage("Sesion demo iniciada.");
      },
      async signOut() {
        await authClient.signOut();
        setUser(null);
        setAuthMessage(null);
      }
    }),
    [authMessage, loading, user]
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
