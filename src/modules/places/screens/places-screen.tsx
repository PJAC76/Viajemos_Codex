import { placesQueries } from "../../../modules/places/data/places-queries";
import { EntityCard } from "../../../components/trips/entity-card";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";

export function PlacesScreen() {
  const items = placesQueries.listPlaces("trip-tokyo");

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Sitios y favoritos"
        description="Catalogo compartido de hoteles, restaurantes y lugares guardados."
        action={<Button>Añadir sitio</Button>}
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((place) => (
          <EntityCard
            key={place.id}
            image={place.image}
            title={place.name}
            subtitle={place.address}
            meta={[place.notes ?? "Sin notas", place.phone ?? "Sin telefono", place.website ?? "Enlace pendiente"]}
            secondaryLabel={`${place.rating}`}
            status={place.favorite ? "Favorito" : undefined}
            actionLabel={place.type === "restaurant" ? "Ver detalles" : "Abrir ficha"}
          />
        ))}
      </div>
    </div>
  );
}
