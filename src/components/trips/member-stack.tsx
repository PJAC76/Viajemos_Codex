import { tripMembers } from "../../mocks/db";
import { cn } from "../../lib/utils";

export function MemberStack({ tripId, size = "md" }: { tripId: string; size?: "sm" | "md" }) {
  const members = tripMembers.filter((member) => member.tripId === tripId);

  return (
    <div className="flex items-center -space-x-3">
      {members.slice(0, 4).map((member) => (
        <img
          key={member.id}
          src={member.avatarUrl}
          alt={member.displayName}
          className={cn(
            "rounded-full border-2 border-white object-cover dark:border-slate-900",
            size === "sm" ? "h-8 w-8" : "h-10 w-10"
          )}
        />
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
