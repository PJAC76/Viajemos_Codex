import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "../../../app/providers/session-provider";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { formatCurrency } from "../../../lib/utils";
import { useDocuments } from "../data/use-documents-data";
import type { TripDocumentUpsertInput } from "../domain/types";
import { useExpenses } from "../../expenses/data/use-expenses-data";
import { useReservations } from "../../reservations/data/use-reservations-data";
import { useTripMembers, useTripPermission } from "../../trips/data/use-trips-data";

function formatDateTime(date?: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function formatFileSize(size?: number) {
  if (!size) {
    return "Tamano desconocido";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}

function documentTypeLabel(type: "pdf" | "image" | "file") {
  if (type === "pdf") {
    return "PDF";
  }

  if (type === "image") {
    return "Imagen";
  }

  return "Archivo";
}

export function DocumentsScreen() {
  const { tripId } = useParams();
  const { user } = useSession();
  const { members, loading: membersLoading } = useTripMembers(tripId);
  const { isAdmin } = useTripPermission(tripId);
  const userNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member.displayName])),
    [members]
  );
  const { documents, groupedCounts, loading, error, reload, createDocument, deleteDocument, openDocument } = useDocuments(tripId, userNames);
  const { expenses, loading: expensesLoading } = useExpenses(tripId, userNames);
  const { reservations, loading: reservationsLoading } = useReservations(tripId);

  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "image" | "file">("all");
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [form, setForm] = useState<TripDocumentUpsertInput>({
    title: "",
    description: "",
    expenseId: "",
    reservationId: ""
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesType = typeFilter === "all" || document.type === typeFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        document.title.toLowerCase().includes(query) ||
        document.fileName.toLowerCase().includes(query) ||
        (document.description ?? "").toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [documents, search, typeFilter]);

  function resetForm() {
    setShowForm(false);
    setSelectedFile(null);
    setSubmitting(false);
    setForm({
      title: "",
      description: "",
      expenseId: "",
      reservationId: ""
    });
  }

  function startCreateFlow() {
    setActionError(null);
    setShowForm(true);
    setSelectedFile(null);
    setForm({
      title: "",
      description: "",
      expenseId: "",
      reservationId: ""
    });
  }

  async function handleCreateDocument() {
    if (!selectedFile) {
      setActionError("Selecciona un archivo antes de subirlo al viaje.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      await createDocument(
        {
          title: form.title.trim(),
          description: form.description?.trim() || undefined,
          expenseId: form.expenseId || undefined,
          reservationId: form.reservationId || undefined
        },
        selectedFile
      );
      resetForm();
    } catch (documentError) {
      setActionError(documentError instanceof Error ? documentError.message : "No se pudo subir el documento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenDocument(documentId: string) {
    const document = documents.find((item) => item.id === documentId);

    if (!document) {
      return;
    }

    try {
      setBusyDocumentId(documentId);
      setActionError(null);
      await openDocument(document);
    } catch (documentError) {
      setActionError(documentError instanceof Error ? documentError.message : "No se pudo abrir el documento seleccionado.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function handleDeleteDocument(documentId: string, storageKey: string) {
    try {
      setBusyDocumentId(documentId);
      setActionError(null);
      await deleteDocument(documentId, storageKey);
    } catch (documentError) {
      setActionError(documentError instanceof Error ? documentError.message : "No se pudo borrar el documento.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  if (loading || membersLoading || expensesLoading || reservationsLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando documentos...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar los documentos" description={error} onRetry={() => void reload()} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Documentos"
        description="Storage privado por viaje para seguros, billetes, adjuntos y documentos de apoyo del grupo."
        action={<Button onClick={startCreateFlow}>{showForm ? "Nuevo documento" : "Subir documento"}</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Documentos totales" value={String(groupedCounts.total)} icon="folder_open" />
        <StatCard label="PDFs" value={String(groupedCounts.pdf)} icon="picture_as_pdf" />
        <StatCard label="Imagenes" value={String(groupedCounts.images)} icon="image" />
      </div>

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      {showForm ? (
        <Card className="p-6">
          <SectionHeader
            title="Subir documento"
            description="Puedes asociarlo opcionalmente a un gasto o a una reserva para encontrarlo mas rapido despues."
            action={
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
            }
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Titulo</p>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Seguro de viaje, billetes, voucher..."
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Archivo</p>
              <Input
                type="file"
                accept=".pdf,image/*,.doc,.docx,.txt,.zip"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setSelectedFile(nextFile);

                  if (nextFile && !form.title.trim()) {
                    const inferredTitle = nextFile.name.replace(/\.[^.]+$/, "");
                    setForm((current) => ({ ...current, title: inferredTitle }));
                  }
                }}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedFile ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}` : "PDF, imagen u otro adjunto del viaje."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Asociar a gasto</p>
              <select
                value={form.expenseId ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, expenseId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Sin asociar</option>
                {expenses.map((expense) => (
                  <option key={expense.id} value={expense.id}>
                    {expense.concept} · {formatCurrency(expense.amount)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Asociar a reserva</p>
              <select
                value={form.reservationId ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, reservationId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Sin asociar</option>
                {reservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>
                    {reservation.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Descripcion</p>
              <textarea
                value={form.description ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Notas para el grupo, condiciones, recordatorios..."
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void handleCreateDocument()} disabled={submitting || !selectedFile || !form.title.trim()}>
              {submitting ? "Subiendo..." : "Guardar documento"}
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader title="Filtros" description="Busca por titulo o nombre de archivo y filtra por tipo." />
            <div className="mt-4 grid gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por titulo, archivo o descripcion"
              />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as "all" | "pdf" | "image" | "file")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="all">Todos los tipos</option>
                <option value="pdf">PDF</option>
                <option value="image">Imagen</option>
                <option value="file">Archivo</option>
              </select>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Enlaces rapidos" description="Relaciona documentos con otros modulos del viaje." />
            <div className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <p>Vincula un documento a un gasto para guardar tickets, justificantes o facturas.</p>
              <p>Vinculalo a una reserva para tener localizadores, vouchers o condiciones a mano.</p>
              <p>Todos los miembros del viaje pueden consultar estos archivos privados.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {filteredDocuments.length === 0 ? (
            <EmptyState
              title="Aun no hay documentos para mostrar"
              description="Sube el primer archivo del viaje o ajusta los filtros para ver resultados."
            />
          ) : (
            filteredDocuments.map((document) => {
              const canDelete = Boolean(user && (isAdmin || document.createdBy === user.id));

              return (
                <Card key={document.id} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{documentTypeLabel(document.type)}</Badge>
                        {document.expenseLabel ? <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Gasto</Badge> : null}
                        {document.reservationLabel ? <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Reserva</Badge> : null}
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{document.title}</h3>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{document.fileName}</p>
                      {document.description ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{document.description}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>Subido por {document.createdByName}</span>
                        <span>{formatDateTime(document.updatedAt ?? document.createdAt)}</span>
                      </div>
                      {document.expenseLabel || document.reservationLabel ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {document.expenseLabel ? <span>Gasto: {document.expenseLabel}</span> : null}
                          {document.reservationLabel ? <span>Reserva: {document.reservationLabel}</span> : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => void handleOpenDocument(document.id)}
                        disabled={busyDocumentId === document.id}
                      >
                        {busyDocumentId === document.id ? "Abriendo..." : "Abrir"}
                      </Button>
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          onClick={() => void handleDeleteDocument(document.id, document.storageKey)}
                          disabled={busyDocumentId === document.id}
                        >
                          Borrar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
