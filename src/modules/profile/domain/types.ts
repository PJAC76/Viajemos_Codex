import type { AuthProvider } from "../../auth/domain/types";

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  loginProvider: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileUpdateInput {
  displayName: string;
  avatarUrl?: string;
}
