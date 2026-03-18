export type AuthProvider = "email" | "google" | "demo";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProvider;
}
