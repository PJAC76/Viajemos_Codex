import { Card } from "../ui/card";

export function StatCard({
  label,
  value,
  icon,
  hint
}: {
  label: string;
  value: string;
  icon: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}
