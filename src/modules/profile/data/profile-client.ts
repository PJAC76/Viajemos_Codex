import { mockUser } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { AuthUser } from "../../auth/domain/types";
import type { ProfileUpdateInput, UserProfile } from "../domain/types";

function normalizeProvider(provider: string | undefined): AuthUser["provider"] {
  if (provider === "google" || provider === "github") {
    return provider;
  }

  if (provider === "demo") {
    return "demo";
  }

  return "email";
}

function normalizeProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    userId: String(row.user_id),
    displayName: typeof row.display_name === "string" ? row.display_name : mockUser.displayName,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : undefined,
    loginProvider: normalizeProvider(typeof row.login_provider === "string" ? row.login_provider : undefined),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function mergeAuthUserWithProfile(user: AuthUser, profile?: UserProfile | null): AuthUser {
  if (!profile) {
    return user;
  }

  return {
    ...user,
    displayName: profile.displayName || user.displayName,
    avatarUrl: profile.avatarUrl ?? user.avatarUrl,
    provider: profile.loginProvider || user.provider
  };
}

export const profileClient = {
  async getCurrentProfile(userId: string): Promise<UserProfile | null> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return {
        userId: mockUser.id,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        loginProvider: mockUser.provider
      };
    }

    const { data, error } = await insforge.database.from("profiles").select("*").eq("user_id", userId).maybeSingle();

    if (error) {
      throw new Error(error.message ?? "No se pudo cargar el perfil.");
    }

    return data ? normalizeProfileRow(data as Record<string, unknown>) : null;
  },

  async ensureCurrentProfile(user: AuthUser): Promise<AuthUser> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return user;
    }

    const currentProfile = await this.getCurrentProfile(user.id);

    if (currentProfile) {
      return mergeAuthUserWithProfile(user, currentProfile);
    }

    const payload = {
      user_id: user.id,
      display_name: user.displayName,
      avatar_url: user.avatarUrl ?? null,
      login_provider: user.provider
    };

    const { data, error } = await insforge.database.from("profiles").insert(payload).select().single();

    if (error) {
      throw new Error(error.message ?? "No se pudo inicializar el perfil.");
    }

    return mergeAuthUserWithProfile(user, normalizeProfileRow(data as Record<string, unknown>));
  },

  async updateCurrentProfile(user: AuthUser, input: ProfileUpdateInput): Promise<AuthUser> {
    const insforge = getInsforgeClient();
    const avatarUrl = input.avatarUrl?.trim() || undefined;
    const displayName = input.displayName.trim();

    if (!insforge) {
      return {
        ...user,
        displayName,
        avatarUrl
      };
    }

    const { error: authError } = await insforge.auth.setProfile({
      name: displayName,
      avatar_url: avatarUrl ?? null
    });

    if (authError) {
      throw new Error(authError.message ?? "No se pudo actualizar el perfil de autenticacion.");
    }

    const existingProfile = await this.getCurrentProfile(user.id);
    const payload = {
      user_id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl ?? null,
      login_provider: user.provider
    };

    const query = existingProfile
      ? insforge.database.from("profiles").update(payload).eq("user_id", user.id).select().single()
      : insforge.database.from("profiles").insert(payload).select().single();

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message ?? "No se pudo guardar el perfil.");
    }

    return mergeAuthUserWithProfile(user, normalizeProfileRow(data as Record<string, unknown>));
  }
};
