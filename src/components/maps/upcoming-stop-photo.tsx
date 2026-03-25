import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { mapsRouteService } from "../../services/maps-route-service";

interface UpcomingStopPhotoState {
  imageUrl: string | null;
  attributionName: string | null;
  attributionUrl: string | null;
}

const photoCache = new Map<string, UpcomingStopPhotoState>();

function buildPhotoQuery(title: string, address?: string) {
  return [title.trim(), address?.trim() ?? ""].filter(Boolean).join(", ");
}

export function UpcomingStopPhoto({
  title,
  address,
  className
}: {
  title: string;
  address?: string;
  className?: string;
}) {
  const [state, setState] = useState<UpcomingStopPhotoState>(() => {
    const query = buildPhotoQuery(title, address);
    return photoCache.get(query) ?? { imageUrl: null, attributionName: null, attributionUrl: null };
  });

  useEffect(() => {
    let cancelled = false;
    const query = buildPhotoQuery(title, address);

    const cachedPhoto = photoCache.get(query);
    if (cachedPhoto) {
      setState(cachedPhoto);
      return;
    }

    setState({ imageUrl: null, attributionName: null, attributionUrl: null });

    void mapsRouteService
      .searchPlacePhoto(query)
      .then((result) => {
        if (cancelled) {
          return;
        }

        const nextState: UpcomingStopPhotoState = {
          imageUrl: result?.imageUrl ?? null,
          attributionName: result?.attribution?.displayName ?? null,
          attributionUrl: result?.attribution?.uri ?? null
        };
        photoCache.set(query, nextState);
        setState(nextState);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        const nextState = { imageUrl: null, attributionName: null, attributionUrl: null };
        photoCache.set(query, nextState);
        setState(nextState);
      });

    return () => {
      cancelled = true;
    };
  }, [address, title]);

  return (
    <div className={cn("relative h-28 w-full overflow-hidden rounded-xl bg-slate-100 md:w-32", className)}>
      {state.imageUrl ? (
        <>
          <img src={state.imageUrl} alt={title} className="h-full w-full object-cover" />
          {state.attributionName ? (
            state.attributionUrl ? (
              <a
                href={state.attributionUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-white/85 px-2 py-1 text-[10px] font-medium text-slate-700"
              >
                Foto: {state.attributionName}
              </a>
            ) : (
              <span className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-white/85 px-2 py-1 text-[10px] font-medium text-slate-700">
                Foto: {state.attributionName}
              </span>
            )
          ) : null}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[11px] font-medium text-slate-400">
          Sin foto
        </div>
      )}
    </div>
  );
}
