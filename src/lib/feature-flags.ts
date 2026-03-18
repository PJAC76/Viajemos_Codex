export const featureFlags = {
  auth: true,
  trips: true,
  members: true,
  invitations: true,
  places: true,
  reservations: true,
  itinerary: true,
  maps: true,
  expenses: true,
  settlements: true,
  documents: true,
  messages: true,
  notifications: true,
  explore: true,
  favorites: true,
  profile: true,
  settings: true
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag) {
  return featureFlags[flag];
}
