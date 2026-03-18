import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

export function Badge({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
