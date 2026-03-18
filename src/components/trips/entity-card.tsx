import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function EntityCard({
  image,
  title,
  subtitle,
  meta,
  status,
  actionLabel,
  secondaryLabel
}: {
  image: string;
  title: string;
  subtitle: string;
  meta: string[];
  status?: string;
  actionLabel?: string;
  secondaryLabel?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/10] w-full bg-slate-200">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        {status ? <Badge className="absolute left-3 top-3 bg-white/90 text-primary">{status}</Badge> : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          {secondaryLabel ? <Badge>{secondaryLabel}</Badge> : null}
        </div>
        <div className="mt-4 space-y-1 text-sm text-slate-500 dark:text-slate-400">
          {meta.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {actionLabel ? (
          <div className="mt-4">
            <Button fullWidth>{actionLabel}</Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
