import { tripInvitations, tripMembers, trips } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { AuthUser } from "../../auth/domain/types";
import type { Trip, TripInvitation, TripMember, TripUpsertInput } from "../domain/types";

const fallbackCoverImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

function normalizeTrip(row: Record<string, unknown>): Trip {
  return {
    id: String(row.id),
    title: typeof row.title === "string" ? row.title : "Viaje sin titulo",
    destination: typeof row.destination === "string" ? row.destination : "Destino pendiente",
    description: typeof row.description === "string" ? row.description : "",
    coverImage: typeof row.cover_image === "string" && row.cover_image.length > 0 ? row.cover_image : fallbackCoverImage,
    startDate: typeof row.start_date === "string" ? row.start_date : "",
    endDate: typeof row.end_date === "string" ? row.end_date : "",
    currency: "EUR",
    status:
      row.status === "draft" || row.status === "closed" || row.status === "active" ? row.status : "draft",
    createdBy: typeof row.created_by === "string" ? row.created_by : "",
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function normalizeTripMember(
  row: Record<string, unknown>,
  profile?: Record<string, unknown>
): TripMember {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    userId: String(row.user_id),
    displayName:
      typeof profile?.display_name === "string"
        ? profile.display_name
        : typeof row.user_id === "string"
          ? row.user_id
          : "Miembro",
    avatarUrl: typeof profile?.avatar_url === "string" ? profile.avatar_url : undefined,
    role: row.role === "admin" ? "admin" : "member",
    status: row.status === "invited" ? "invited" : "active",
    joinedAt: typeof row.joined_at === "string" ? row.joined_at : undefined
  };
}

function normalizeTripInvitation(row: Record<string, unknown>): TripInvitation {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    email: typeof row.email === "string" ? row.email : "",
    status:
      row.status === "accepted" || row.status === "expired" || row.status === "revoked" || row.status === "pending"
        ? row.status
        : "pending",
    invitedBy: typeof row.invited_by === "string" ? row.invited_by : "",
    shareUrl: typeof row.share_url === "string" ? row.share_url : undefined,
    token: typeof row.token === "string" ? row.token : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined
  };
}

async function loadProfilesMap(userIds: string[]) {
  const insforge = getInsforgeClient();

  if (!insforge || userIds.length === 0) {
    return new Map<string, Record<string, unknown>>();
  }

  const { data, error } = await insforge.database.from("profiles").select("*").in("user_id", userIds);

  if (error) {
    throw new Error(error.message ?? "No se pudieron cargar los perfiles del viaje.");
  }

  return new Map(
    ((data as Array<Record<string, unknown>> | null) ?? []).map((profile) => [String(profile.user_id), profile])
  );
}

export const tripsQueries = {
  async listTrips(userId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const memberTripIds = new Set(tripMembers.filter((member) => member.userId === userId).map((member) => member.tripId));
      return trips.filter((trip) => memberTripIds.has(trip.id));
    }

    const membershipsResult = await insforge.database
      .from("trip_members")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("joined_at", { ascending: true });

    if (membershipsResult.error) {
      throw new Error(membershipsResult.error.message ?? "No se pudieron cargar tus viajes.");
    }

    const memberships = (membershipsResult.data as Array<Record<string, unknown>> | null) ?? [];

    if (memberships.length === 0) {
      return [];
    }

    const tripIds = memberships.map((membership) => String(membership.trip_id));
    const tripsResult = await insforge.database
      .from("trips")
      .select("*")
      .in("id", tripIds)
      .order("start_date", { ascending: true });

    if (tripsResult.error) {
      throw new Error(tripsResult.error.message ?? "No se pudieron cargar tus viajes.");
    }

    return ((tripsResult.data as Array<Record<string, unknown>> | null) ?? []).map(normalizeTrip);
  },

  async getTrip(tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return trips.find((trip) => trip.id === tripId) ?? null;
    }

    const { data, error } = await insforge.database.from("trips").select("*").eq("id", tripId).maybeSingle();

    if (error) {
      throw new Error(error.message ?? "No se pudo cargar el viaje.");
    }

    return data ? normalizeTrip(data as Record<string, unknown>) : null;
  },

  async getMembers(tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return tripMembers.filter((member) => member.tripId === tripId);
    }

    const membersResult = await insforge.database
      .from("trip_members")
      .select("*")
      .eq("trip_id", tripId)
      .in("status", ["active", "invited"])
      .order("joined_at", { ascending: true });

    if (membersResult.error) {
      throw new Error(membersResult.error.message ?? "No se pudieron cargar los miembros del viaje.");
    }

    const members = (membersResult.data as Array<Record<string, unknown>> | null) ?? [];
    const profilesMap = await loadProfilesMap(members.map((member) => String(member.user_id)));

    return members
      .map((member) => normalizeTripMember(member, profilesMap.get(String(member.user_id))))
      .sort((left, right) => {
        if (left.role === right.role) {
          return left.displayName.localeCompare(right.displayName, "es");
        }

        return left.role === "admin" ? -1 : 1;
      });
  },

  async getInvitations(tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return tripInvitations.filter((invitation) => invitation.tripId === tripId);
    }

    const { data, error } = await insforge.database
      .from("trip_invitations")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar las invitaciones.");
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map(normalizeTripInvitation);
  },

  async createTrip(user: AuthUser, input: TripUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return trips[0];
    }

    const tripId = crypto.randomUUID();

    const { error: tripError } = await insforge.database.from("trips").insert({
      id: tripId,
      title: input.title.trim(),
      destination: input.destination.trim(),
      description: input.description.trim(),
      cover_image: input.coverImage?.trim() || null,
      start_date: input.startDate,
      end_date: input.endDate,
      currency: "EUR",
      status: "active",
      created_by: user.id
    });

    if (tripError) {
      throw new Error(tripError.message ?? "No se pudo crear el viaje.");
    }

    const { error: memberError } = await insforge.database.from("trip_members").insert({
      trip_id: tripId,
      user_id: user.id,
      role: "admin",
      status: "active"
    });

    if (memberError) {
      throw new Error(memberError.message ?? "El viaje se creo, pero no se pudo registrar tu acceso.");
    }

    const trip = await this.getTrip(tripId);

    if (!trip) {
      throw new Error("El viaje se creo, pero no se pudo recuperar su ficha.");
    }

    return trip;
  },

  async updateTrip(tripId: string, input: TripUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const trip = trips.find((item) => item.id === tripId);
      return trip
        ? {
            ...trip,
            ...input,
            coverImage: input.coverImage || trip.coverImage
          }
        : null;
    }

    const { data, error } = await insforge.database
      .from("trips")
      .update({
        title: input.title.trim(),
        destination: input.destination.trim(),
        description: input.description.trim(),
        cover_image: input.coverImage?.trim() || null,
        start_date: input.startDate,
        end_date: input.endDate
      })
      .eq("id", tripId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar el viaje.");
    }

    return normalizeTrip(data as Record<string, unknown>);
  },

  async deleteTrip(tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return;
    }

    const { error } = await insforge.database.from("trips").delete().eq("id", tripId);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar el viaje.");
    }
  }
};
