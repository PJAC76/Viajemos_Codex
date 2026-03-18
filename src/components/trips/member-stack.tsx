import { cn } from "../../lib/utils";
import { useTripMembers } from "../../modules/trips/data/use-trips-data";

export function MemberStack({ tripId, size = "md" }: { tripId: string; size?: "sm" | "md" }) {
  const { members } = useTripMembers(tripId);

  return (
    <div className="flex items-center -space-x-3">
      {members.slice(0, 4).map((member) => (
        <div
          key={member.id}
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary/15 text-xs font-bold text-primary dark:border-slate-900",
            size === "sm" ? "h-8 w-8" : "h-10 w-10"
          )}
          title={member.displayName}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{member.displayName.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
      ))}
      {members.length > 4 ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-bold text-white dark:border-slate-900",
            size === "sm" ? "h-8 w-8" : "h-10 w-10"
          )}
        >
          +{members.length - 4}
        </div>
      ) : null}
    </div>
  );
}
