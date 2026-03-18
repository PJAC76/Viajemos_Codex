import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient } from "../../modules/auth/data/auth-client";
import type { AuthUser } from "../../modules/auth/domain/types";
import { profileClient } from "../../modules/profile/data/profile-client";
import type { ProfileUpdateInput } from "../../modules/profile/domain/types";

interface SessionContextValue {
  user: AuthUser | null;
  loading: boolean;
  authMessage: string | null;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (payload: { email: string; password: string; name?: string }) => Promise<{ requiresEmailVerification: boolean }>;
  signInWithGoogle: () => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  async function loadCurrentUser() {
    const currentUser = await authClient.getCurrentUser();

    if (!currentUser) {
      setUser(null);
      return;
    }

    const hydratedUser = await profileClient.ensureCurrentProfile(currentUser);
    setUser(hydratedUser);
  }

  useEffect(() => {
    loadCurrentUser()
      .catch((error) => {
        console.error(error);
        setAuthMessage(error instanceof Error ? error.message : "No se pudo restaurar la sesion.");
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      authMessage,
      async signInWithPassword(credentials) {
        const signedUser = await profileClient.ensureCurrentProfile(await authClient.signInWithPassword(credentials));
        setUser(signedUser);
        setAuthMessage(null);
      },
      async signUp(payload) {
        const result = await authClient.signUp(payload);

        if (result.user && !result.requiresEmailVerification) {
          const signedUser = await profileClient.ensureCurrentProfile(result.user);
          setUser(signedUser);
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

        if (signedUser) {
          setUser(signedUser);
        }
      },
      async sendResetPasswordEmail(email) {
        await authClient.sendResetPasswordEmail(email);
        setAuthMessage("Te hemos enviado las instrucciones de recuperacion.");
      },
      async signInDemo() {
        const signedUser = await profileClient.ensureCurrentProfile(await authClient.signInDemo());
        setUser(signedUser);
        setAuthMessage("Sesion demo iniciada.");
      },
      async updateProfile(input) {
        if (!user) {
          throw new Error("Necesitas iniciar sesion para editar el perfil.");
        }

        const nextUser = await profileClient.updateCurrentProfile(user, input);
        setUser(nextUser);
        setAuthMessage("Perfil actualizado correctamente.");
      },
      async refreshCurrentUser() {
        const currentUser = await authClient.getCurrentUser();

        if (!currentUser) {
          setUser(null);
          return;
        }

        const hydratedUser = await profileClient.ensureCurrentProfile(currentUser);
        setUser(hydratedUser);
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
