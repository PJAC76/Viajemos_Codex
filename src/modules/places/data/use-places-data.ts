import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { Trip } from "../../trips/domain/types";
import type { Place, PlaceUpsertInput } from "../domain/types";
import { placesQueries } from "./places-queries";

export function usePlacesCatalog(tripId?: string) {
  const { user } = useSession();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPlaces(await placesQueries.listPlaces(tripId, user?.id));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar los sitios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId, user?.id]);

  async function createPlace(input: PlaceUpsertInput) {
    if (!tripId || !user) {
      throw new Error("Necesitas iniciar sesion dentro de un viaje para crear sitios.");
    }

    const createdPlace = await placesQueries.createPlace(tripId, user.id, input);
    setPlaces((currentPlaces) => [createdPlace, ...currentPlaces]);
    return createdPlace;
  }

  async function updatePlace(placeId: string, input: PlaceUpsertInput) {
    const updatedPlace = await placesQueries.updatePlace(placeId, input, user?.id);

    if (!updatedPlace) {
      return null;
    }

    setPlaces((currentPlaces) => currentPlaces.map((place) => (place.id === placeId ? updatedPlace : place)));
    return updatedPlace;
  }

  async function deletePlace(placeId: string) {
    await placesQueries.deletePlace(placeId);
    setPlaces((currentPlaces) => currentPlaces.filter((place) => place.id !== placeId));
  }

  async function toggleFavorite(placeId: string, isFavorite: boolean) {
    if (!tripId || !user) {
      throw new Error("Necesitas una sesion activa para gestionar favoritos.");
    }

    await placesQueries.toggleFavorite(tripId, placeId, user.id, isFavorite);
    setPlaces((currentPlaces) =>
      currentPlaces.map((place) =>
        place.id === placeId
          ? {
              ...place,
              favorite: !isFavorite,
              favoriteCount: Math.max(0, place.favoriteCount + (isFavorite ? -1 : 1))
            }
          : place
      )
    );
  }

  return {
    places,
    loading,
    error,
    reload,
    createPlace,
    updatePlace,
    deletePlace,
    toggleFavorite
  };
}

export function useFavoritesFeed() {
  const { user } = useSession();
  const [favorites, setFavorites] = useState<Array<Place & { trip: Trip | null }>>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      if (!user) {
        if (active) {
          setFavorites([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextFavorites = await placesQueries.listFavoritesForUserTrips(user.id);

        if (active) {
          setFavorites(nextFavorites);
        }
      } catch (queryError) {
        if (active) {
          setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar los favoritos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      active = false;
    };
  }, [user?.id]);

  return {
    favorites,
    loading,
    error
  };
}
