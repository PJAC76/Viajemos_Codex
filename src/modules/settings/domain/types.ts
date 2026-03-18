export type StartScreen = "trips" | "explore" | "notifications";
export type DefaultMapMode = "driving" | "walking" | "transit";

export interface UserSettings {
  userId: string;
  startScreen: StartScreen;
  preferredTripId?: string;
  defaultMapMode: DefaultMapMode;
  compactMode: boolean;
  emailNotifications: boolean;
  expenseNotifications: boolean;
  itineraryNotifications: boolean;
  messageNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettingsUpdateInput {
  startScreen: StartScreen;
  preferredTripId?: string;
  defaultMapMode: DefaultMapMode;
  compactMode: boolean;
  emailNotifications: boolean;
  expenseNotifications: boolean;
  itineraryNotifications: boolean;
  messageNotifications: boolean;
}

export const defaultUserSettings: UserSettingsUpdateInput = {
  startScreen: "trips",
  preferredTripId: undefined,
  defaultMapMode: "driving",
  compactMode: false,
  emailNotifications: true,
  expenseNotifications: true,
  itineraryNotifications: true,
  messageNotifications: true
};
