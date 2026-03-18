import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

export function Card({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
