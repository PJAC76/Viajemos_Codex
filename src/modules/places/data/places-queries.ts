import { places, trips } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import { tripsQueries } from "../../trips/data/trips-queries";
import type { Trip } from "../../trips/domain/types";
import type { Place, PlaceUpsertInput } from "../domain/types";

const fallbackPlaceImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

function normalizePlaceType(value: unknown): Place["type"] {
  return value === "hotel" || value === "restaurant" || value === "place" ? value : "place";
}

function normalizePlace(
  row: Record<string, unknown>,
  favoritesByPlaceId: Map<string, number>,
  currentUserId?: string
): Place {
  const placeId = String(row.id);
  const favoriteCount = favoritesByPlaceId.get(placeId) ?? 0;
  const currentUserFavoriteCount = currentUserId
    ? Number(row.current_user_favorite_count ?? row.viewer_favorite_count ?? 0)
    : 0;

  return {
    id: placeId,
    tripId: String(row.trip_id),
    type: normalizePlaceType(row.type),
    name: typeof row.name === "string" ? row.name : "Lugar sin nombre",
    address: typeof row.address === "string" ? row.address : "",
    rating: typeof row.rating === "number" ? row.rating : undefined,
    image: typeof row.image_url === "string" && row.image_url.length > 0 ? row.image_url : fallbackPlaceImage,
    latitude: typeof row.latitude === "number" ? row.latitude : undefined,
    longitude: typeof row.longitude === "number" ? row.longitude : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    website: typeof row.website_url === "string" ? row.website_url : undefined,
    notes: typeof row.notes === "string" ? row.notes : undefined,
    createdBy: typeof row.created_by === "string" ? row.created_by : "",
    favorite: currentUserFavoriteCount > 0 || favoriteCount > 0,
    favoriteCount
  };
}

async function listFavoriteRowsForTrip(tripId: string) {
  const insforge = getInsforgeClient();

  if (!insforge) {
    return [];
  }

  const { data, error } = await insforge.database.from("place_favorites").select("*").eq("trip_id", tripId);

  if (error) {
    throw new Error(error.message ?? "No se pudieron cargar los favoritos del viaje.");
  }

  return (data as Array<Record<string, unknown>> | null) ?? [];
}

function buildFavoritesMap(rows: Array<Record<string, unknown>>) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const placeId = String(row.place_id);
    counts.set(placeId, (counts.get(placeId) ?? 0) + 1);
  }

  return counts;
}

export const placesQueries = {
  async listPlaces(tripId: string, currentUserId?: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return places.filter((place) => place.tripId === tripId);
    }

    const [placesResult, favoriteRows] = await Promise.all([
      insforge.database.from("places").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }),
      listFavoriteRowsForTrip(tripId)
    ]);

    if (placesResult.error) {
      throw new Error(placesResult.error.message ?? "No se pudieron cargar los sitios del viaje.");
    }

    const favoriteCounts = buildFavoritesMap(favoriteRows);
    const currentUserFavoriteIds = new Set(
      favoriteRows
        .filter((row) => (currentUserId ? String(row.user_id) === currentUserId : false))
        .map((row) => String(row.place_id))
    );

    return ((placesResult.data as Array<Record<string, unknown>> | null) ?? []).map((row) =>
      normalizePlace(
        {
          ...row,
          current_user_favorite_count: currentUserFavoriteIds.has(String(row.id)) ? 1 : 0
        },
        favoriteCounts,
        currentUserId
      )
    );
  },

  async listFavoritesForUserTrips(userId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const tripsMap = new Map(trips.map((trip) => [trip.id, trip]));

      return places.filter((place) => place.favorite).map((place) => ({
        ...place,
        trip: tripsMap.get(place.tripId) ?? null
      }));
    }

    const userTrips = await tripsQueries.listTrips(userId);

    if (userTrips.length === 0) {
      return [] as Array<Place & { trip: Trip | null }>;
    }

    const tripIds = userTrips.map((trip) => trip.id);
    const favoriteRowsResult = await insforge.database.from("place_favorites").select("*").in("trip_id", tripIds);

    if (favoriteRowsResult.error) {
      throw new Error(favoriteRowsResult.error.message ?? "No se pudieron cargar tus favoritos.");
    }

    const favoriteRows = (favoriteRowsResult.data as Array<Record<string, unknown>> | null) ?? [];

    if (favoriteRows.length === 0) {
      return [];
    }

    const favoriteCounts = buildFavoritesMap(favoriteRows);
    const currentUserFavoriteIds = new Set(
      favoriteRows.filter((row) => String(row.user_id) === userId).map((row) => String(row.place_id))
    );
    const placeIds = Array.from(new Set(favoriteRows.map((row) => String(row.place_id))));
    const placesResult = await insforge.database.from("places").select("*").in("id", placeIds);

    if (placesResult.error) {
      throw new Error(placesResult.error.message ?? "No se pudieron cargar los sitios favoritos.");
    }

    const tripsMap = new Map(userTrips.map((trip) => [trip.id, trip]));

    return ((placesResult.data as Array<Record<string, unknown>> | null) ?? [])
      .map((row) =>
        normalizePlace(
          {
            ...row,
            current_user_favorite_count: currentUserFavoriteIds.has(String(row.id)) ? 1 : 0
          },
          favoriteCounts,
          userId
        )
      )
      .filter((place) => place.favoriteCount > 0)
      .sort((left, right) => right.favoriteCount - left.favoriteCount || left.name.localeCompare(right.name, "es"))
      .map((place) => ({
        ...place,
        trip: tripsMap.get(place.tripId) ?? null
      }));
  },

  async createPlace(tripId: string, userId: string, input: PlaceUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const place: Place = {
        id: `place-${crypto.randomUUID()}`,
        tripId,
        createdBy: userId,
        favorite: false,
        favoriteCount: 0,
        ...input
      };

      places.unshift(place);
      return place;
    }

    const { data, error } = await insforge.database
      .from("places")
      .insert([
        {
          trip_id: tripId,
          type: input.type,
          name: input.name.trim(),
          address: input.address.trim(),
          rating: typeof input.rating === "number" ? input.rating : null,
          image_url: input.image?.trim() || null,
          latitude: typeof input.latitude === "number" ? input.latitude : null,
          longitude: typeof input.longitude === "number" ? input.longitude : null,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          website_url: input.website?.trim() || null,
          notes: input.notes?.trim() || null,
          created_by: userId
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo crear el sitio.");
    }

    return normalizePlace(data as Record<string, unknown>, new Map(), userId);
  },

  async updatePlace(placeId: string, input: PlaceUpsertInput, currentUserId?: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const place = places.find((item) => item.id === placeId);

      if (!place) {
        return null;
      }

      Object.assign(place, input);
      return place;
    }

    const { data, error } = await insforge.database
      .from("places")
      .update({
        type: input.type,
        name: input.name.trim(),
        address: input.address.trim(),
        rating: typeof input.rating === "number" ? input.rating : null,
        image_url: input.image?.trim() || null,
        latitude: typeof input.latitude === "number" ? input.latitude : null,
        longitude: typeof input.longitude === "number" ? input.longitude : null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        website_url: input.website?.trim() || null,
        notes: input.notes?.trim() || null
      })
      .eq("id", placeId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar el sitio.");
    }

    return normalizePlace(data as Record<string, unknown>, new Map(), currentUserId);
  },

  async deletePlace(placeId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const placeIndex = places.findIndex((item) => item.id === placeId);

      if (placeIndex >= 0) {
        places.splice(placeIndex, 1);
      }

      return;
    }

    const { error } = await insforge.database.from("places").delete().eq("id", placeId);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar el sitio.");
    }
  },

  async toggleFavorite(tripId: string, placeId: string, userId: string, isFavorite: boolean) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const place = places.find((item) => item.id === placeId);

      if (place) {
        place.favorite = !isFavorite;
        place.favoriteCount = Math.max(0, place.favoriteCount + (isFavorite ? -1 : 1));
      }

      return;
    }

    if (isFavorite) {
      const { error } = await insforge.database
        .from("place_favorites")
        .delete()
        .eq("trip_id", tripId)
        .eq("place_id", placeId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message ?? "No se pudo quitar este favorito.");
      }

      return;
    }

    const { error } = await insforge.database.from("place_favorites").insert([
      {
        trip_id: tripId,
        place_id: placeId,
        user_id: userId
      }
    ]);

    if (error) {
      throw new Error(error.message ?? "No se pudo marcar como favorito.");
    }
  }
};
