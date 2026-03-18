import { routeSnapshots } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { RouteSegment, RouteSnapshot, RouteSnapshotDraft, RouteTravelMode } from "../../itinerary/domain/types";

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeTravelMode(value: unknown): RouteTravelMode {
  return value === "walking" || value === "transit" ? value : "driving";
}

function normalizeSegments(value: unknown): RouteSegment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((segment) => {
    const entry = segment as Record<string, unknown>;

    return {
      from: typeof entry.from === "string" ? entry.from : "Origen",
      to: typeof entry.to === "string" ? entry.to : "Destino",
      distanceKm: toNumber(entry.distanceKm ?? entry.distance_km),
      durationMinutes: Math.round(toNumber(entry.durationMinutes ?? entry.duration_minutes))
    };
  });
}

function normalizeRouteSnapshot(row: Record<string, unknown>): RouteSnapshot {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    dayId: String(row.day_id),
    totalDistanceKm: toNumber(row.total_distance_km),
    totalDurationMinutes: Math.round(toNumber(row.total_duration_minutes)),
    travelMode: normalizeTravelMode(row.travel_mode),
    createdBy: typeof row.created_by === "string" ? row.created_by : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    segments: normalizeSegments(row.segments)
  };
}

export const routeSnapshotsQueries = {
  async getDaySnapshot(tripId: string, dayId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return routeSnapshots.find((snapshot) => snapshot.tripId === tripId && snapshot.dayId === dayId) ?? null;
    }

    const { data, error } = await insforge.database
      .from("route_snapshots")
      .select("*")
      .eq("trip_id", tripId)
      .eq("day_id", dayId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message ?? "No se pudo cargar la ruta guardada del dia.");
    }

    return data ? normalizeRouteSnapshot(data as Record<string, unknown>) : null;
  },

  async saveDaySnapshot(snapshot: RouteSnapshotDraft, userId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const existingSnapshot = routeSnapshots.find((entry) => entry.dayId === snapshot.dayId);

      if (existingSnapshot) {
        Object.assign(existingSnapshot, {
          ...snapshot,
          createdBy: existingSnapshot.createdBy ?? userId,
          updatedAt: new Date().toISOString()
        });
        return existingSnapshot;
      }

      const nextSnapshot: RouteSnapshot = {
        id: `route-${crypto.randomUUID()}`,
        ...snapshot,
        createdBy: userId,
        updatedAt: new Date().toISOString()
      };
      routeSnapshots.push(nextSnapshot);
      return nextSnapshot;
    }

    const { data: existingSnapshot, error: existingError } = await insforge.database
      .from("route_snapshots")
      .select("id")
      .eq("day_id", snapshot.dayId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message ?? "No se pudo comprobar la ruta guardada del dia.");
    }

    if (existingSnapshot && typeof (existingSnapshot as Record<string, unknown>).id === "string") {
      const { data, error } = await insforge.database
        .from("route_snapshots")
        .update({
          total_distance_km: snapshot.totalDistanceKm,
          total_duration_minutes: snapshot.totalDurationMinutes,
          travel_mode: snapshot.travelMode,
          segments: snapshot.segments
        })
        .eq("id", String((existingSnapshot as Record<string, unknown>).id))
        .select()
        .single();

      if (error) {
        throw new Error(error.message ?? "No se pudo actualizar la ruta guardada del dia.");
      }

      return normalizeRouteSnapshot(data as Record<string, unknown>);
    }

    const { data, error } = await insforge.database
      .from("route_snapshots")
      .insert([
        {
          trip_id: snapshot.tripId,
          day_id: snapshot.dayId,
          total_distance_km: snapshot.totalDistanceKm,
          total_duration_minutes: snapshot.totalDurationMinutes,
          travel_mode: snapshot.travelMode,
          segments: snapshot.segments,
          created_by: userId
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo guardar la ruta del dia.");
    }

    return normalizeRouteSnapshot(data as Record<string, unknown>);
  }
};
