import { Link, Navigate } from "react-router-dom";
import { trips } from "../../../mocks/db";
import { MemberStack } from "../../../components/trips/member-stack";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { formatDateRange } from "../../../lib/utils";

export function TripsScreen() {
  if (trips.length === 1) {
    return <Navigate to={`/trips/${trips[0].id}/summary`} replace />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Mis viajes"
        description="Base de viajes privados con acceso por invitacion y layout consistente entre desktop y mobile."
        action={<Button>Crear viaje</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {trips.map((trip) => (
          <Card key={trip.id} className="overflow-hidden">
            <img src={trip.coverImage} alt={trip.title} className="h-56 w-full object-cover" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{trip.title}</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {formatDateRange(trip.startDate, trip.endDate)} · {trip.destination}
                  </p>
                </div>
                <MemberStack tripId={trip.id} />
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{trip.description}</p>
              <div className="mt-6">
                <Link to={`/trips/${trip.id}/summary`}>
                  <Button>Entrar al viaje</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
