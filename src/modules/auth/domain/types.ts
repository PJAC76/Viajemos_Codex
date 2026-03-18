export type AuthProvider = "email" | "google" | "github" | "demo";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProvider;
}
