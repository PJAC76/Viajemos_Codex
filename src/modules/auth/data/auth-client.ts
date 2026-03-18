import { mockUser } from "../../../mocks/db";
import { getSupabaseClient } from "../../../lib/supabase/client";
import type { AuthUser } from "../domain/types";

export const authClient = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return mockUser;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.full_name ?? user.email.split("@")[0],
      avatarUrl: user.user_metadata?.avatar_url,
      provider: user.app_metadata?.provider === "google" ? "google" : "email"
    };
  },

  async signInWithEmail(): Promise<AuthUser> {
    return mockUser;
  },

  async signInWithGoogle(): Promise<AuthUser> {
    return {
      ...mockUser,
      provider: "google"
    };
  },

  async signOut() {
    const supabase = getSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }
  }
};
