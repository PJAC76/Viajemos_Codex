import { Button } from "../ui/button";

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/40 dark:bg-rose-950/20">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30">
        <span className="material-symbols-outlined">error</span>
      </div>
      <h3 className="text-lg font-bold text-rose-700 dark:text-rose-300">{title}</h3>
      <p className="mt-2 text-sm text-rose-600/80 dark:text-rose-200/80">{description}</p>
      <div className="mt-4">
        <Button variant="secondary">Reintentar</Button>
      </div>
    </div>
  );
}
