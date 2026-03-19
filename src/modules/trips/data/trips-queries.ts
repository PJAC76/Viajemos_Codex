import { tripInvitations, tripMembers, trips } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { AuthUser } from "../../auth/domain/types";
import { authClient } from "../../auth/data/auth-client";
import type { Trip, TripInvitation, TripInvitationPreview, TripMember, TripRole, TripUpsertInput } from "../domain/types";

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
    settlementStatus: row.settlement_status === "closed" ? "closed" : "open",
    settlementClosedAt: typeof row.settlement_closed_at === "string" ? row.settlement_closed_at : undefined,
    settlementClosedBy: typeof row.settlement_closed_by === "string" ? row.settlement_closed_by : undefined,
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

function normalizeInvitationStatus(value: unknown): TripInvitation["status"] {
  return value === "accepted" || value === "expired" || value === "revoked" || value === "pending" ? value : "pending";
}

function normalizeTripInvitationPreview(row: Record<string, unknown>): TripInvitationPreview {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    tripTitle: typeof row.trip_title === "string" ? row.trip_title : "Viaje privado",
    destination: typeof row.trip_destination === "string" ? row.trip_destination : "Destino pendiente",
    coverImage: typeof row.trip_cover_image === "string" ? row.trip_cover_image : undefined,
    startDate: typeof row.trip_start_date === "string" ? row.trip_start_date : "",
    endDate: typeof row.trip_end_date === "string" ? row.trip_end_date : "",
    email: typeof row.email === "string" ? row.email : "",
    status: normalizeInvitationStatus(row.status),
    invitedBy: typeof row.invited_by === "string" ? row.invited_by : "",
    invitedByName: typeof row.invited_by_name === "string" ? row.invited_by_name : "Admin del viaje",
    shareUrl: typeof row.share_url === "string" ? row.share_url : undefined,
    viewerEmail: typeof row.viewer_email === "string" ? row.viewer_email : undefined,
    viewerMatchesEmail: Boolean(row.viewer_matches_email)
  };
}

function buildInvitationShareUrl(token: string) {
  if (typeof window === "undefined") {
    return `https://viajemos.app/invite/${token}`;
  }

  return `${window.location.origin}/invite/${token}`;
}

function buildInvitationToken() {
  return `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
}

function getInvitationPreviewFallback(token: string) {
  const invitation = tripInvitations.find((item) => item.token === token || item.shareUrl?.endsWith(`/${token}`));
  const trip = invitation ? trips.find((item) => item.id === invitation.tripId) : null;

  if (!invitation || !trip) {
    return null;
  }

  return {
    id: invitation.id,
    tripId: trip.id,
    tripTitle: trip.title,
    destination: trip.destination,
    coverImage: trip.coverImage,
    startDate: trip.startDate,
    endDate: trip.endDate,
    email: invitation.email,
    status: invitation.status,
    invitedBy: invitation.invitedBy,
    invitedByName: tripMembers.find((member) => member.userId === invitation.invitedBy)?.displayName ?? "Admin del viaje",
    shareUrl: invitation.shareUrl,
    viewerMatchesEmail: false
  } satisfies TripInvitationPreview;
}

function normalizeRpcRows(data: unknown) {
  if (Array.isArray(data)) {
    return data as Array<Record<string, unknown>>;
  }

  if (data && typeof data === "object") {
    return [data as Record<string, unknown>];
  }

  return [];
}

function normalizeScalarRpcValue<T>(data: unknown): T | null {
  if (data === null || data === undefined) {
    return null;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return null;
    }

    return data[0] as T;
  }

  return data as T;
}

function isExpiredJwtMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("jwt expired") || normalized.includes("expired jwt") || normalized.includes("token expired");
}

async function withSessionRefresh<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!isExpiredJwtMessage(message)) {
      throw error;
    }

    const refreshedUser = await authClient.refreshSession().catch(() => null);

    if (!refreshedUser) {
      throw new Error("Tu sesion ha caducado. Vuelve a iniciar sesion para continuar.");
    }

    return operation();
  }
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
  async isGlobalAdmin() {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return false;
    }

    const { data, error } = await insforge.database.rpc("is_global_admin");

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar los permisos globales.");
    }

    return Boolean(normalizeScalarRpcValue<boolean>(data));
  },

  async getViewerRole(tripId: string, userId?: string): Promise<TripRole | null> {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const member = tripMembers.find((item) => item.tripId === tripId && item.userId === userId && item.status === "active");
      return member?.role ?? null;
    }

    const { data, error } = await insforge.database.rpc("get_trip_viewer_role", {
      target_trip_id: tripId
    });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar los permisos del viaje.");
    }

    const role = normalizeScalarRpcValue<string | null>(data);
    return role === "admin" || role === "member" ? role : null;
  },

  async listTrips(userId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const memberTripIds = new Set(tripMembers.filter((member) => member.userId === userId).map((member) => member.tripId));
      return trips.filter((trip) => memberTripIds.has(trip.id));
    }

    if (await this.isGlobalAdmin()) {
      const tripsResult = await insforge.database.from("trips").select("*").order("start_date", { ascending: true });

      if (tripsResult.error) {
        throw new Error(tripsResult.error.message ?? "No se pudieron cargar los viajes.");
      }

      return ((tripsResult.data as Array<Record<string, unknown>> | null) ?? []).map(normalizeTrip);
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
      return tripInvitations.filter((invitation) => invitation.tripId === tripId && invitation.status === "pending");
    }

    const { data, error } = await insforge.database
      .from("trip_invitations")
      .select("*")
      .eq("trip_id", tripId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar las invitaciones.");
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map(normalizeTripInvitation);
  },

  async createInvitation(tripId: string, invitedBy: string, email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const token = buildInvitationToken();
    const shareUrl = buildInvitationShareUrl(token);
    const insforge = getInsforgeClient();

    if (!cleanEmail) {
      throw new Error("Escribe el email de la persona a la que quieres invitar.");
    }

    if (!insforge) {
      const invitation: TripInvitation = {
        id: `invite-${crypto.randomUUID()}`,
        tripId,
        email: cleanEmail,
        status: "pending",
        invitedBy,
        token,
        shareUrl,
        createdAt: new Date().toISOString()
      };

      tripInvitations.unshift(invitation);
      return invitation;
    }

    return withSessionRefresh(async () => {
      const revokeExistingResult = await insforge.database
        .from("trip_invitations")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString()
        })
        .eq("trip_id", tripId)
        .eq("email", cleanEmail)
        .eq("status", "pending");

      if (revokeExistingResult.error) {
        throw new Error(revokeExistingResult.error.message ?? "No se pudo preparar la nueva invitacion.");
      }

      const { data, error } = await insforge.database
        .from("trip_invitations")
        .insert([
          {
            trip_id: tripId,
            email: cleanEmail,
            token,
            status: "pending",
            invited_by: invitedBy,
            share_url: shareUrl
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message ?? "No se pudo crear la invitacion.");
      }

      return normalizeTripInvitation(data as Record<string, unknown>);
    });
  },

  async revokeInvitation(invitationId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const invitation = tripInvitations.find((item) => item.id === invitationId);

      if (invitation) {
        invitation.status = "revoked";
      }

      return;
    }

    const { error } = await insforge.database
      .from("trip_invitations")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString()
      })
      .eq("id", invitationId);

    if (error) {
      throw new Error(error.message ?? "No se pudo revocar la invitacion.");
    }
  },

  async removeMember(memberId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const memberIndex = tripMembers.findIndex((item) => item.id === memberId);

      if (memberIndex >= 0) {
        tripMembers.splice(memberIndex, 1);
      }

      return;
    }

    const { error } = await insforge.database.rpc("remove_trip_member", {
      target_member_id: memberId
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo retirar a este miembro.");
    }
  },

  async updateMemberRole(memberId: string, nextRole: TripRole) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const member = tripMembers.find((item) => item.id === memberId);

      if (!member) {
        throw new Error("No se encontro el miembro.");
      }

      member.role = nextRole;
      return member;
    }

    const { data, error } = await insforge.database.rpc("set_trip_member_role", {
      target_member_id: memberId,
      next_role: nextRole
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar el rol del miembro.");
    }

    const rows = normalizeRpcRows(data);
    const row = rows[0];

    if (!row) {
      throw new Error("El rol se actualizo, pero no pudimos refrescar el miembro.");
    }

    return row;
  },

  async getInvitationPreview(token: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return getInvitationPreviewFallback(token);
    }

    const { data, error } = await insforge.database.rpc("get_trip_invitation_preview", {
      invitation_token: token
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo cargar la invitacion.");
    }

    const rows = normalizeRpcRows(data);
    return rows.length > 0 ? normalizeTripInvitationPreview(rows[0]) : null;
  },

  async acceptInvitation(token: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const invitation = tripInvitations.find((item) => item.token === token || item.shareUrl?.endsWith(`/${token}`));

      if (!invitation) {
        throw new Error("La invitacion ya no esta disponible.");
      }

      invitation.status = "accepted";
      return { tripId: invitation.tripId };
    }

    const { data, error } = await insforge.database.rpc("accept_trip_invitation", {
      invitation_token: token
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo aceptar la invitacion.");
    }

    const rows = normalizeRpcRows(data);
    const tripId = rows[0]?.trip_id;

    if (typeof tripId !== "string") {
      throw new Error("La invitacion se acepto, pero no pudimos abrir el viaje.");
    }

    return { tripId };
  },

  async createTrip(user: AuthUser, input: TripUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return trips[0];
    }

    const { data, error } = await insforge.database.rpc("create_trip_with_admin", {
      trip_title: input.title.trim(),
      trip_destination: input.destination.trim(),
      trip_description: input.description.trim(),
      trip_cover_image: input.coverImage?.trim() || null,
      trip_start_date: input.startDate,
      trip_end_date: input.endDate
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo crear el viaje.");
    }

    const tripId = normalizeScalarRpcValue<string>(data);

    if (!tripId) {
      throw new Error("El viaje se creo, pero no pudimos recuperar su identificador.");
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
