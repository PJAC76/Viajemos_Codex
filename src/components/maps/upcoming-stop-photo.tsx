import { GooglePlaceImage } from "./google-place-image";

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
  return (
    <GooglePlaceImage
      alt={title}
      searchQuery={buildPhotoQuery(title, address)}
      className={className ?? "h-28 w-full rounded-xl md:w-32"}
      emptyLabel="Sin foto"
    />
  );
}
