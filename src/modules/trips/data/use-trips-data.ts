import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { Trip, TripInvitation, TripMember, TripRole, TripUpsertInput } from "../domain/types";
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

  return {
    trips,
    loading,
    error,
    reload,
    createTrip
  };
}

export function useTripOverview(tripId?: string) {
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

  return {
    trip,
    members,
    invitations,
    loading,
    error,
    reload,
    updateTrip,
    deleteTrip
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
  const [loading, setLoading] = useState(Boolean(user && tripId));

  useEffect(() => {
    let active = true;

    async function loadPermission() {
      if (!user || !tripId) {
        if (active) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const members = await tripsQueries.getMembers(tripId);
        const membership = members.find((member) => member.userId === user.id);

        if (active) {
          setRole(membership?.role ?? null);
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
    loading,
    isAdmin: role === "admin",
    hasAccess: role !== null
  };
}
