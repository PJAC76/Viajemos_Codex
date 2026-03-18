import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { ExploreSnapshot } from "../domain/types";
import { exploreQueries } from "./explore-queries";

export function useExploreData() {
  const { user } = useSession();
  const [snapshot, setSnapshot] = useState<ExploreSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!user) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSnapshot(await exploreQueries.getExploreSnapshot(user.id));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudo abrir la vista de exploracion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [user?.id]);

  return {
    snapshot,
    loading,
    error,
    reload
  };
}
