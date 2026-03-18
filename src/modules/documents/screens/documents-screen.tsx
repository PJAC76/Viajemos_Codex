import { documents } from "../../../mocks/db";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export function DocumentsScreen() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Documentos"
        description="Storage privado por viaje para documentos generales, tickets y adjuntos."
        action={<Button>Subir documento</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((document) => (
          <Card key={document.id} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{document.type}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{document.title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Actualizado {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(document.updatedAt))}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
