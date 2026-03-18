import type { ItineraryItem } from "../../modules/itinerary/domain/types";

export function Timeline({ items }: { items: ItineraryItem[] }) {
  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white ring-4 ring-primary/15">
              <span className="material-symbols-outlined text-[18px]">{item.icon ?? "place"}</span>
            </div>
            {index < items.length - 1 ? <div className="my-2 h-full w-px bg-slate-200 dark:bg-slate-700" /> : null}
          </div>
          <div className="pb-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{item.startTime}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.notes}</p>
            <p className="mt-3 text-xs font-medium text-slate-400">{item.transitLabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
