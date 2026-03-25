import { Link } from "react-router-dom";
import { GooglePlaceImage } from "../../../components/maps/google-place-image";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useFavoritesFeed } from "../../places/data/use-places-data";

export function FavoritesScreen() {
  const { favorites, loading, error } = useFavoritesFeed();

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando favoritos...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar los favoritos" description={error} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Favoritos"
        description="Hoteles, restaurantes y lugares marcados por el grupo en todos tus viajes activos."
      />
      {favorites.length === 0 ? (
        <EmptyState
          title="Aun no hay favoritos compartidos"
          description="Marca un sitio como favorito desde cualquier viaje para encontrarlo rapido aqui."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((place) => (
            <Card key={place.id} className="overflow-hidden">
              <div className="relative aspect-[16/10] w-full bg-slate-200">
                <GooglePlaceImage
                  src={place.image}
                  alt={place.name}
                  searchQuery={[place.name, place.address].filter(Boolean).join(", ")}
                  className="h-full w-full"
                />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <Badge className="bg-white/90 text-primary">
                    {place.type === "hotel" ? "Hotel" : place.type === "restaurant" ? "Restaurante" : "Lugar"}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800">{place.favoriteCount} favoritos</Badge>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{place.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{place.address}</p>
                </div>
                {place.trip ? (
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                    <p className="font-semibold text-slate-900 dark:text-white">{place.trip.title}</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{place.trip.destination}</p>
                  </div>
                ) : null}
                <p className="text-sm text-slate-500 dark:text-slate-400">{place.notes || "Sin notas compartidas."}</p>
                <Link to={`/trips/${place.tripId}/places`}>
                  <Button fullWidth>Ver en el viaje</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
