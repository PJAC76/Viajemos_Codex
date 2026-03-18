import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { UserSettings, UserSettingsUpdateInput } from "../domain/types";
import { settingsQueries } from "./settings-queries";

export function useUserSettings() {
  const { user } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSettings(await settingsQueries.ensureCurrentSettings(user.id));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar tus ajustes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [user?.id]);

  async function updateSettings(input: UserSettingsUpdateInput) {
    if (!user) {
      throw new Error("Necesitas iniciar sesion para editar tus ajustes.");
    }

    const nextSettings = await settingsQueries.updateCurrentSettings(user.id, input);
    setSettings(nextSettings);
    return nextSettings;
  }

  return {
    settings,
    loading,
    error,
    reload,
    updateSettings
  };
}
