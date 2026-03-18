import { mockUser } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { AuthUser } from "../domain/types";

const postAuthRedirectKey = "viajemos.post_auth_redirect";

function normalizeAuthUser(user: {
  id: string;
  email: string;
  providers?: string[];
  profile?: Record<string, unknown> | null;
}): AuthUser {
  const profile = user.profile ?? {};
  const provider = user.providers?.includes("google") ? "google" : user.providers?.includes("github") ? "github" : "email";

  return {
    id: user.id,
    email: user.email,
    displayName:
      typeof profile.name === "string" && profile.name.length > 0 ? profile.name : user.email.split("@")[0],
    avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : undefined,
    provider
  };
}

export const authClient = {
  setPostAuthRedirect(path?: string) {
    if (typeof window === "undefined") {
      return;
    }

    const nextPath = path?.trim() || "/trips";
    window.sessionStorage.setItem(postAuthRedirectKey, nextPath);
  },

  consumePostAuthRedirect() {
    if (typeof window === "undefined") {
      return null;
    }

    const nextPath = window.sessionStorage.getItem(postAuthRedirectKey);

    if (nextPath) {
      window.sessionStorage.removeItem(postAuthRedirectKey);
    }

    return nextPath;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return mockUser;
    }

    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data?.user?.email) {
      return null;
    }

    return normalizeAuthUser(data.user);
  },

  async signInWithPassword({ email, password }: { email: string; password: string }): Promise<AuthUser> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return mockUser;
    }

    const { data, error } = await insforge.auth.signInWithPassword({ email, password });

    if (error || !data?.user) {
      throw new Error(error?.message ?? "No se pudo iniciar sesion con InsForge.");
    }

    return normalizeAuthUser(data.user);
  },

  async signInWithGoogle(redirectPath = "/trips"): Promise<AuthUser | null> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return {
        ...mockUser,
        provider: "google"
      };
    }

    this.setPostAuthRedirect(redirectPath);

    const { data, error } = await insforge.auth.signInWithOAuth({
      provider: "google",
      redirectTo: `${window.location.origin}/auth/login`
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo iniciar el flujo OAuth con Google.");
    }

    return data?.provider ? null : null;
  },

  async signUp({
    email,
    password,
    name
  }: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ user: AuthUser | null; requiresEmailVerification: boolean }> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return {
        user: {
          ...mockUser,
          email,
          displayName: name || mockUser.displayName
        },
        requiresEmailVerification: false
      };
    }

    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo crear la cuenta.");
    }

    return {
      user: data?.user ? normalizeAuthUser(data.user) : null,
      requiresEmailVerification: Boolean(data?.requireEmailVerification)
    };
  },

  async resendVerificationEmail(email: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return;
    }

    const { error } = await insforge.auth.resendVerificationEmail({ email });

    if (error) {
      throw new Error(error.message ?? "No se pudo reenviar el codigo de verificacion.");
    }
  },

  async verifyEmailCode({ email, otp }: { email: string; otp: string }): Promise<AuthUser> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return {
        ...mockUser,
        email
      };
    }

    const { data, error } = await insforge.auth.verifyEmail({ email, otp });

    if (error || !data?.user) {
      throw new Error(error?.message ?? "No se pudo verificar el codigo.");
    }

    return normalizeAuthUser(data.user);
  },

  async sendResetPasswordEmail(email: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return;
    }

    const { error } = await insforge.auth.sendResetPasswordEmail({ email });

    if (error) {
      throw new Error(error.message ?? "No se pudo enviar el correo de recuperacion.");
    }
  },

  async exchangeResetPasswordToken({ email, code }: { email: string; code: string }) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return "demo-reset-token";
    }

    const { data, error } = await insforge.auth.exchangeResetPasswordToken({ email, code });

    if (error || !data?.token) {
      throw new Error(error?.message ?? "No se pudo validar el codigo de recuperacion.");
    }

    return data.token;
  },

  async resetPassword({ otp, newPassword }: { otp: string; newPassword: string }) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return;
    }

    const { error } = await insforge.auth.resetPassword({ otp, newPassword });

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar la contrasena.");
    }
  },

  async signInDemo(): Promise<AuthUser> {
    if (getInsforgeClient()) {
      throw new Error("La sesion demo solo esta disponible cuando la app funciona sin backend real.");
    }

    return mockUser;
  },

  async signOut() {
    const insforge = getInsforgeClient();

    if (insforge) {
      const { error } = await insforge.auth.signOut();

      if (error) {
        throw new Error(error.message ?? "No se pudo cerrar sesion.");
      }
    }
  }
};
