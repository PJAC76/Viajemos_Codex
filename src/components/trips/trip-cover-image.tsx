import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

const fallbackCoverImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

function normalizeCoverImageUrl(value?: string) {
  if (!value || value.trim().length === 0) {
    return fallbackCoverImage;
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

export function TripCoverImage({
  src,
  alt,
  className
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(normalizeCoverImageUrl(src));

  useEffect(() => {
    setCurrentSrc(normalizeCoverImageUrl(src));
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn(className)}
      onError={() => setCurrentSrc(fallbackCoverImage)}
    />
  );
}
