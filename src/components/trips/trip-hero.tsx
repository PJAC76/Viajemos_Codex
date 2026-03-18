import { formatDateRange } from "../../lib/utils";
import { Badge } from "../ui/badge";

export function TripHero({
  title,
  startDate,
  endDate,
  coverImage,
  destination
}: {
  title: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  destination: string;
}) {
  return (
    <header
      className="relative overflow-hidden rounded-[28px] border border-white/40 bg-slate-900 shadow-soft"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(16,24,34,0.1) 0%, rgba(16,24,34,0.78) 90%), url(${coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="flex min-h-[280px] flex-col justify-end p-6 md:min-h-[320px] md:p-8">
        <Badge className="mb-4 w-fit bg-white/20 text-white backdrop-blur">Viaje privado</Badge>
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm font-medium text-white/85 md:text-base">
          {formatDateRange(startDate, endDate)} · {destination}
        </p>
      </div>
    </header>
  );
}
