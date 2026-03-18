import { messages } from "../../../mocks/db";
import { SectionHeader } from "../../../components/trips/section-header";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export function MessagesScreen() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Mensajes" description="Canal de comunicacion del viaje, preparado para realtime en Supabase." />
      <Card className="p-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-900 dark:text-white">{message.authorName}</p>
                <p className="text-xs text-slate-400">{new Intl.DateTimeFormat("es-ES", { timeStyle: "short", dateStyle: "short" }).format(new Date(message.createdAt))}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message.body}</p>
            </div>
          ))}
          <div className="flex gap-3">
            <Input placeholder="Escribe un mensaje..." />
            <Button>Enviar</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
