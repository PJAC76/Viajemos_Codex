import { placesQueries } from "../../../modules/places/data/places-queries";
import { EntityCard } from "../../../components/trips/entity-card";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";

export function ReservationsScreen() {
  const items = placesQueries.listReservations("trip-tokyo");

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Reservas"
        description="Lectura compartida para todos los miembros y edicion reservada al admin."
        action={<Button>Registrar reserva</Button>}
      />
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((reservation) => (
          <EntityCard
            key={reservation.id}
            image="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80"
            title={reservation.title}
            subtitle={reservation.confirmationCode}
            meta={[
              new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reservation.startAt)),
              `${reservation.partySize} personas`,
              reservation.notes ?? "Sin notas"
            ]}
            status={reservation.status}
            actionLabel="Ver ticket digital"
          />
        ))}
      </div>
    </div>
  );
}
