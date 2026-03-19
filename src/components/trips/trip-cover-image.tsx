import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

const fallbackCoverImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

export function TripCoverImage({
  src,
  alt,
  className
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackCoverImage);

  useEffect(() => {
    setCurrentSrc(src || fallbackCoverImage);
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
