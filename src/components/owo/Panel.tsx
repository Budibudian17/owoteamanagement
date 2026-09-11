import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Panel({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-panel sm:p-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold sm:text-base">{title}</h2>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="pt-4">{children}</div>
    </section>
  );
}
