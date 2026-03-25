import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { mapsRouteService } from "../../services/maps-route-service";

interface ImageAttribution {
  name: string | null;
  url: string | null;
}

type ImageSourceKind = "provided" | "google" | "fallback";

const defaultFallbackImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

function normalizeImageUrl(value?: string | null) {
  if (!value || value.trim().length === 0) {
    return null;
  }

  const rawUrl = value.trim();

  try {
    const parsedUrl = new URL(rawUrl);

    if (parsedUrl.hostname === "commons.wikimedia.org" && parsedUrl.pathname.startsWith("/wiki/File:")) {
      const fileName = parsedUrl.pathname.slice("/wiki/File:".length);
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}`;
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

export function GooglePlaceImage({
  src,
  alt,
  searchQuery,
  fallbackSrc = defaultFallbackImage,
  className,
  imgClassName,
  emptyLabel = "Sin foto"
}: {
  src?: string | null;
  alt: string;
  searchQuery?: string;
  fallbackSrc?: string;
  className?: string;
  imgClassName?: string;
  emptyLabel?: string;
}) {
  const normalizedProvidedSrc = useMemo(() => normalizeImageUrl(src), [src]);
  const normalizedFallbackSrc = useMemo(() => normalizeImageUrl(fallbackSrc) ?? defaultFallbackImage, [fallbackSrc]);
  const normalizedQuery = useMemo(() => searchQuery?.trim() ?? "", [searchQuery]);
  const [currentSrc, setCurrentSrc] = useState<string | null>(normalizedProvidedSrc ?? null);
  const [sourceKind, setSourceKind] = useState<ImageSourceKind>(normalizedProvidedSrc ? "provided" : "fallback");
  const [attribution, setAttribution] = useState<ImageAttribution>({ name: null, url: null });

  useEffect(() => {
    let cancelled = false;

    async function resolveBestImage() {
      if (normalizedProvidedSrc) {
        setCurrentSrc(normalizedProvidedSrc);
        setSourceKind("provided");
        setAttribution({ name: null, url: null });
        return;
      }

      if (normalizedQuery.length > 0) {
        try {
          const result = await mapsRouteService.searchPlacePhoto(normalizedQuery);

          if (!cancelled && result?.imageUrl) {
            setCurrentSrc(result.imageUrl);
            setSourceKind("google");
            setAttribution({
              name: result.attribution?.displayName ?? null,
              url: result.attribution?.uri ?? null
            });
            return;
          }
        } catch {
          // Fall back to the static image below.
        }
      }

      if (!cancelled) {
        setCurrentSrc(normalizedFallbackSrc);
        setSourceKind("fallback");
        setAttribution({ name: null, url: null });
      }
    }

    void resolveBestImage();

    return () => {
      cancelled = true;
    };
  }, [normalizedFallbackSrc, normalizedProvidedSrc, normalizedQuery]);

  async function handleImageError() {
    if (sourceKind === "provided" && normalizedQuery.length > 0) {
      try {
        const result = await mapsRouteService.searchPlacePhoto(normalizedQuery);

        if (result?.imageUrl) {
          setCurrentSrc(result.imageUrl);
          setSourceKind("google");
          setAttribution({
            name: result.attribution?.displayName ?? null,
            url: result.attribution?.uri ?? null
          });
          return;
        }
      } catch {
        // Ignore and keep going to fallback.
      }
    }

    setCurrentSrc(normalizedFallbackSrc);
    setSourceKind("fallback");
    setAttribution({ name: null, url: null });
  }

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      {currentSrc ? (
        <img src={currentSrc} alt={alt} className={cn("h-full w-full object-cover", imgClassName)} onError={() => void handleImageError()} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-slate-400">{emptyLabel}</div>
      )}
      {sourceKind === "google" && attribution.name ? (
        attribution.url ? (
          <a
            href={attribution.url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-white/85 px-2 py-1 text-[10px] font-medium text-slate-700"
          >
            Foto: {attribution.name}
          </a>
        ) : (
          <span className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-white/85 px-2 py-1 text-[10px] font-medium text-slate-700">
            Foto: {attribution.name}
          </span>
        )
      ) : null}
    </div>
  );
}
