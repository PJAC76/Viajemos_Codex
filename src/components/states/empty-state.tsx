import { Button } from "../ui/button";

export function EmptyState({
  title,
  description,
  actionLabel
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined">inbox</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {actionLabel ? (
        <div className="mt-5">
          <Button variant="secondary">{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
