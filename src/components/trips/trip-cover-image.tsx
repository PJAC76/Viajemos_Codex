import { GooglePlaceImage } from "../maps/google-place-image";

const fallbackCoverImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

export function TripCoverImage({
  src,
  alt,
  className,
  searchQuery
}: {
  src?: string;
  alt: string;
  className?: string;
  searchQuery?: string;
}) {
  return (
    <GooglePlaceImage
      src={src}
      alt={alt}
      searchQuery={searchQuery}
      fallbackSrc={fallbackCoverImage}
      className={className}
    />
  );
}
