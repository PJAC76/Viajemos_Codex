import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { Trip, TripInvitation, TripInvitationPreview, TripMember, TripRole, TripUpsertInput } from "../domain/types";
import { tripsQueries } from "./trips-queries";

export function useTripsList() {
  const { user } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTrips(await tripsQueries.listTrips(user.id));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar los viajes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [user?.id]);

  async function createTrip(input: TripUpsertInput) {
    if (!user) {
      throw new Error("Necesitas iniciar sesion para crear un viaje.");
    }

    const nextTrip = await tripsQueries.createTrip(user, input);
    setTrips((currentTrips) => [...currentTrips, nextTrip].sort((left, right) => left.startDate.localeCompare(right.startDate)));
    return nextTrip;
  }

  async function deleteTrip(tripId: string) {
    await tripsQueries.deleteTrip(tripId);
    setTrips((currentTrips) => currentTrips.filter((trip) => trip.id !== tripId));
  }

  return {
    trips,
    loading,
    error,
    reload,
    createTrip,
    deleteTrip
  };
}

export function useTripOverview(tripId?: string) {
  const { user } = useSession();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId) {
      setTrip(null);
      setMembers([]);
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextTrip, nextMembers, nextInvitations] = await Promise.all([
        tripsQueries.getTrip(tripId),
        tripsQueries.getMembers(tripId),
        tripsQueries.getInvitations(tripId)
      ]);
      setTrip(nextTrip);
      setMembers(nextMembers);
      setInvitations(nextInvitations);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudo cargar el viaje.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId]);

  async function updateTrip(input: TripUpsertInput) {
    if (!tripId) {
      throw new Error("No se encontro el viaje.");
    }

    const nextTrip = await tripsQueries.updateTrip(tripId, input);
    setTrip(nextTrip);
    return nextTrip;
  }

  async function deleteTrip() {
    if (!tripId) {
      throw new Error("No se encontro el viaje.");
    }

    await tripsQueries.deleteTrip(tripId);
    setTrip(null);
    setMembers([]);
    setInvitations([]);
  }

  async function createInvitation(email: string) {
    if (!tripId || !user) {
      throw new Error("Necesitas un viaje activo y una sesion iniciada para invitar a alguien.");
    }

    const invitation = await tripsQueries.createInvitation(tripId, user.id, email);
    setInvitations((currentInvitations) => [invitation, ...currentInvitations.filter((item) => item.email !== invitation.email)]);
    return invitation;
  }

  async function revokeInvitation(invitationId: string) {
    await tripsQueries.revokeInvitation(invitationId);
    setInvitations((currentInvitations) => currentInvitations.filter((item) => item.id !== invitationId));
  }

  async function removeMember(memberId: string) {
    await tripsQueries.removeMember(memberId);
    setMembers((currentMembers) => currentMembers.filter((item) => item.id !== memberId));
  }

  async function updateMemberRole(memberId: string, role: TripRole) {
    await tripsQueries.updateMemberRole(memberId, role);
    setMembers((currentMembers) =>
      currentMembers
        .map((member) => (member.id === memberId ? { ...member, role } : member))
        .sort((left, right) => {
          if (left.role === right.role) {
            return left.displayName.localeCompare(right.displayName, "es");
          }

          return left.role === "admin" ? -1 : 1;
        })
    );
  }

  return {
    trip,
    members,
    invitations,
    loading,
    error,
    reload,
    updateTrip,
    deleteTrip,
    createInvitation,
    revokeInvitation,
    removeMember,
    updateMemberRole
  };
}

export function useTripMembers(tripId?: string) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      if (!tripId) {
        if (active) {
          setMembers([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextMembers = await tripsQueries.getMembers(tripId);

        if (active) {
          setMembers(nextMembers);
        }
      } catch (queryError) {
        if (active) {
          setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar los miembros.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      active = false;
    };
  }, [tripId]);

  return { members, loading, error };
}

export function useTripPermission(tripId?: string) {
  const { user } = useSession();
  const [role, setRole] = useState<TripRole | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(user && tripId));

  useEffect(() => {
    let active = true;

    async function loadPermission() {
      if (!user || !tripId) {
        if (active) {
          setRole(null);
          setIsGlobalAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const [nextRole, nextIsGlobalAdmin] = await Promise.all([
          tripsQueries.getViewerRole(tripId, user.id),
          tripsQueries.isGlobalAdmin()
        ]);

        if (active) {
          setRole(nextRole);
          setIsGlobalAdmin(nextIsGlobalAdmin);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPermission();

    return () => {
      active = false;
    };
  }, [tripId, user?.id]);

  return {
    role,
    isGlobalAdmin,
    loading,
    isAdmin: role === "admin",
    hasAccess: role !== null
  };
}

export function useTripInvitationPreview(token?: string) {
  const [invitation, setInvitation] = useState<TripInvitationPreview | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      if (!token) {
        if (active) {
          setInvitation(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextInvitation = await tripsQueries.getInvitationPreview(token);

        if (active) {
          setInvitation(nextInvitation);
        }
      } catch (queryError) {
        if (active) {
          setError(queryError instanceof Error ? queryError.message : "No se pudo cargar la invitacion.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      active = false;
    };
  }, [token]);

  return {
    invitation,
    loading,
    error,
    reload: async () => {
      if (!token) {
        setInvitation(null);
        return;
      }

      setLoading(true);
      try {
        setError(null);
        setInvitation(await tripsQueries.getInvitationPreview(token));
      } catch (queryError) {
        setError(queryError instanceof Error ? queryError.message : "No se pudo cargar la invitacion.");
      } finally {
        setLoading(false);
      }
    }
  };
}
