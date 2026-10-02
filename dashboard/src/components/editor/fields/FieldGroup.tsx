import type { ReactNode } from "react";

/** A card of related fields, with an optional title, description and action. */
export function FieldGroup({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card md:p-5">
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h3 className="text-sm font-semibold text-studio-violet">{title}</h3> : null}
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-studio-violet/60">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
