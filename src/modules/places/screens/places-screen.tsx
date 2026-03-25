import { useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorState } from "../../../components/states/error-state";
import { EmptyState } from "../../../components/states/empty-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useSession } from "../../../app/providers/session-provider";
import { useTripPermission } from "../../trips/data/use-trips-data";
import { usePlacesCatalog } from "../data/use-places-data";
import type { Place, PlaceType, PlaceUpsertInput } from "../domain/types";

const fallbackPlaceImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

const emptyPlaceForm: PlaceUpsertInput = {
  type: "place",
  name: "",
  address: "",
  rating: undefined,
  image: "",
  phone: "",
  email: "",
  website: "",
  notes: ""
};

export function PlacesScreen() {
  const { tripId } = useParams();
  const { user } = useSession();
  const { isAdmin } = useTripPermission(tripId);
  const { places, loading, error, createPlace, updatePlace, deletePlace, toggleFavorite } = usePlacesCatalog(tripId);
  const [showForm, setShowForm] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [form, setForm] = useState<PlaceUpsertInput>(emptyPlaceForm);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function startCreateFlow() {
    setActionError(null);
    setEditingPlaceId(null);
    setForm(emptyPlaceForm);
    setShowForm(true);
  }

  function startEditFlow(place: Place) {
    setActionError(null);
    setEditingPlaceId(place.id);
    setForm({
      type: place.type,
      name: place.name,
      address: place.address,
      rating: place.rating,
      image: place.image,
      phone: place.phone,
      email: place.email,
      website: place.website,
      notes: place.notes
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingPlaceId(null);
    setForm(emptyPlaceForm);
    setSubmitting(false);
  }

  async function handleSavePlace() {
    try {
      setSubmitting(true);
      setActionError(null);

      if (editingPlaceId) {
        await updatePlace(editingPlaceId, form);
      } else {
        await createPlace(form);
      }

      resetForm();
    } catch (placeError) {
      setActionError(placeError instanceof Error ? placeError.message : "No se pudo guardar el sitio.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePlace(placeId: string) {
    try {
      setActionError(null);
      await deletePlace(placeId);
    } catch (placeError) {
      setActionError(placeError instanceof Error ? placeError.message : "No se pudo borrar el sitio.");
    }
  }

  async function handleToggleFavorite(place: Place) {
    try {
      setActionError(null);
      await toggleFavorite(place.id, place.favorite);
    } catch (favoriteError) {
      setActionError(favoriteError instanceof Error ? favoriteError.message : "No se pudo actualizar el favorito.");
    }
  }

  function canEditPlace(place: Place) {
    return Boolean(user && isAdmin);
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando sitios...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar los sitios" description={error} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Sitios y favoritos"
        description="Catalogo colaborativo de hoteles, restaurantes y lugares guardados del viaje."
        action={<Button onClick={startCreateFlow}>{showForm ? "Nuevo sitio" : "Anadir sitio"}</Button>}
      />

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      {showForm ? (
        <Card className="p-6">
          <SectionHeader
            title={editingPlaceId ? "Editar sitio" : "Nuevo sitio"}
            description="Cada miembro puede gestionar sus propios sitios; el admin mantiene control total."
            action={
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
            }
          />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Solo nombre y direccion son obligatorios. El resto de campos son opcionales.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {(["hotel", "restaurant", "place"] as PlaceType[]).map((type) => (
                  <Button
                    key={type}
                    variant={form.type === type ? "primary" : "secondary"}
                    onClick={() => setForm((current) => ({ ...current, type }))}
                  >
                    {type === "hotel" ? "Hotel" : type === "restaurant" ? "Restaurante" : "Lugar"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Nombre</p>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Direccion</p>
              <Input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Imagen</p>
              <Input
                value={form.image ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                placeholder="URL opcional"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Valoracion</p>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rating: event.target.value ? Number(event.target.value) : undefined
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Telefono</p>
              <Input value={form.phone ?? ""} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Email</p>
              <Input value={form.email ?? ""} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Web o enlace</p>
              <Input
                value={form.website ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Notas</p>
              <textarea
                value={form.notes ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void handleSavePlace()} disabled={submitting || !form.name.trim() || !form.address.trim()}>
              {submitting ? "Guardando..." : editingPlaceId ? "Actualizar sitio" : "Guardar sitio"}
            </Button>
          </div>
        </Card>
      ) : null}

      {places.length === 0 ? (
        <EmptyState
          title="Aun no hay sitios en este viaje"
          description="Empieza guardando hoteles, restaurantes o rincones del itinerario y marcad vuestros favoritos."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => (
            <Card key={place.id} className="overflow-hidden">
              <div className="relative aspect-[16/10] w-full bg-slate-200">
                {place.image ? (
                  <img
                    src={place.image}
                    alt={place.name}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      const target = event.currentTarget;

                      if (target.dataset.fallbackApplied === "true") {
                        return;
                      }

                      target.dataset.fallbackApplied = "true";
                      target.src = fallbackPlaceImage;
                    }}
                  />
                ) : null}
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <Badge className="bg-white/90 text-primary">
                    {place.type === "hotel" ? "Hotel" : place.type === "restaurant" ? "Restaurante" : "Lugar"}
                  </Badge>
                  {place.favoriteCount > 0 ? (
                    <Badge className="bg-amber-100 text-amber-800">{place.favoriteCount} favoritos</Badge>
                  ) : null}
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{place.name}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{place.address}</p>
                  </div>
                  {typeof place.rating === "number" ? <Badge>{place.rating.toFixed(1)}</Badge> : null}
                </div>
                <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <p>{place.notes || "Sin notas compartidas todavia."}</p>
                  <p>{place.phone || place.email || "Sin datos de contacto"}</p>
                  <p>{place.website || "Enlace pendiente"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={place.favorite ? "primary" : "secondary"} onClick={() => void handleToggleFavorite(place)}>
                    {place.favorite ? "Quitar favorito" : "Marcar favorito"}
                  </Button>
                  {canEditPlace(place) ? (
                    <Button variant="secondary" onClick={() => startEditFlow(place)}>
                      Editar
                    </Button>
                  ) : null}
                  {canEditPlace(place) ? (
                    <Button variant="ghost" onClick={() => void handleDeletePlace(place.id)}>
                      Borrar
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
