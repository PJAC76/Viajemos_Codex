import { placesQueries } from "../../../modules/places/data/places-queries";
import { EntityCard } from "../../../components/trips/entity-card";
import { SectionHeader } from "../../../components/trips/section-header";

export function FavoritesScreen() {
  const favorites = placesQueries.listFavorites("trip-tokyo");

  return (
    <div className="space-y-8">
      <SectionHeader title="Favoritos" description="Acceso rapido a hoteles y restaurantes marcados por el grupo." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {favorites.map((place) => (
          <EntityCard
            key={place.id}
            image={place.image}
            title={place.name}
            subtitle={place.address}
            meta={[place.notes ?? "Sin notas"]}
            status="Favorito"
            secondaryLabel={`${place.rating}`}
          />
        ))}
      </div>
    </div>
  );
}
