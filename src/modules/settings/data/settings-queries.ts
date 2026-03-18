import { getInsforgeClient } from "../../../lib/insforge/client";
import { userSettings as mockUserSettings } from "../../../mocks/db";
import type { UserSettings, UserSettingsUpdateInput } from "../domain/types";
import { defaultUserSettings } from "../domain/types";

function normalizeStartScreen(value: unknown): UserSettings["startScreen"] {
  return value === "explore" || value === "notifications" ? value : "trips";
}

function normalizeMapMode(value: unknown): UserSettings["defaultMapMode"] {
  return value === "walking" || value === "transit" ? value : "driving";
}

function normalizeUserSettings(row: Record<string, unknown>, userId: string): UserSettings {
  return {
    userId,
    startScreen: normalizeStartScreen(row.start_screen),
    preferredTripId: typeof row.preferred_trip_id === "string" ? row.preferred_trip_id : undefined,
    defaultMapMode: normalizeMapMode(row.default_map_mode),
    compactMode: Boolean(row.compact_mode),
    emailNotifications: row.email_notifications !== false,
    expenseNotifications: row.expense_notifications !== false,
    itineraryNotifications: row.itinerary_notifications !== false,
    messageNotifications: row.message_notifications !== false,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function buildSettingsPayload(userId: string, input: UserSettingsUpdateInput) {
  return {
    user_id: userId,
    start_screen: input.startScreen,
    preferred_trip_id: input.preferredTripId || null,
    default_map_mode: input.defaultMapMode,
    compact_mode: input.compactMode,
    email_notifications: input.emailNotifications,
    expense_notifications: input.expenseNotifications,
    itinerary_notifications: input.itineraryNotifications,
    message_notifications: input.messageNotifications
  };
}

function buildDefaultSettings(userId: string): UserSettings {
  return {
    userId,
    ...defaultUserSettings
  };
}

async function readSettingsRow(userId: string) {
  const insforge = getInsforgeClient();

  if (!insforge) {
    const row = mockUserSettings[userId];
    return row ? { ...row, user_id: userId } : null;
  }

  const { data, error } = await insforge.database.from("user_settings").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    throw new Error(error.message ?? "No se pudieron cargar tus ajustes.");
  }

  return (data as Record<string, unknown> | null) ?? null;
}

export const settingsQueries = {
  async getCurrentSettings(userId: string) {
    const row = await readSettingsRow(userId);
    return row ? normalizeUserSettings(row, userId) : null;
  },

  async ensureCurrentSettings(userId: string) {
    const currentSettings = await this.getCurrentSettings(userId);

    if (currentSettings) {
      return currentSettings;
    }

    const insforge = getInsforgeClient();

    if (!insforge) {
      const fallback = buildDefaultSettings(userId);
      mockUserSettings[userId] = fallback;
      return fallback;
    }

    const { data, error } = await insforge.database
      .from("user_settings")
      .insert([buildSettingsPayload(userId, defaultUserSettings)])
      .select()
      .single();

    if (error) {
      if (error.message?.toLowerCase().includes("duplicate")) {
        const nextSettings = await this.getCurrentSettings(userId);

        if (nextSettings) {
          return nextSettings;
        }
      }

      throw new Error(error.message ?? "No se pudieron inicializar tus ajustes.");
    }

    return normalizeUserSettings(data as Record<string, unknown>, userId);
  },

  async updateCurrentSettings(userId: string, input: UserSettingsUpdateInput) {
    const insforge = getInsforgeClient();
    const payload = buildSettingsPayload(userId, input);

    if (!insforge) {
      const nextSettings = {
        userId,
        ...input
      } satisfies UserSettings;

      mockUserSettings[userId] = nextSettings;
      return nextSettings;
    }

    const existingSettings = await this.getCurrentSettings(userId);
    const query = existingSettings
      ? insforge.database.from("user_settings").update(payload).eq("user_id", userId).select().single()
      : insforge.database.from("user_settings").insert([payload]).select().single();

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message ?? "No se pudieron guardar tus ajustes.");
    }

    return normalizeUserSettings(data as Record<string, unknown>, userId);
  }
};
