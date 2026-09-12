"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";
import { useEffect } from "react";

import { Link } from "@/navigation";

/**
 * A cell is either one of the three states, or a plain sentence.
 *
 * The three states answer "is it included?" with a tick or a dash. Some rows
 * cannot be answered that way: the module allowance is "4 modules, then €5
 * each" on Signature and "unlimited" on the other two, and rendering that as a
 * tick loses the number the couple is actually choosing between. Anything that
 * is not one of the three states is printed as written.
 */
export type CompareValue = "inc" | "opt" | "no" | (string & {});

export type CompareRow = {
  key: string;
  label: string;
  signature: CompareValue;
  "sur-mesure": CompareValue;
  prestige: CompareValue;
};

type Plan = { id: string; name: string; price: string };

/**
 * Comparison matrix, opened from the pricing toggle.
 *
 * Follows the overlay pattern already used by ThemeConfigSheet (framer-motion
 * + AnimatePresence) rather than shared/ui/dialog.tsx: that file imports `cn`
 * from "@/lib/utils", which under the landing's tsconfig resolves to
 * landing/src/lib/utils — a module that does not exist. Nothing in the landing
 * imports it for that reason, and repointing it would touch a component the
 * dashboard also consumes.
 */
export function PricingCompareDialog({
  open,
  onClose,
  plans,
  rows,
  highlightedPlanId,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  plans: Plan[];
  rows: CompareRow[];
  highlightedPlanId: string;
  labels: {
    title: string;
    subtitle: string;
    featureHeader: string;
    closeLabel: string;
    included: string;
    excluded: string;
    choose: string;
  };
}) {
  // Escape to dismiss, and the background locked while the sheet is up.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-[32px] bg-studio-beurre"
          >
            {/* No grab handle: the sheet is dismissed by the close button or
                the scrim, never by dragging, so a handle promised an
                interaction that does not exist. */}
            <div className="shrink-0 px-6 pt-6 md:px-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-h2 text-studio-violet">
                    {labels.title}
                  </h3>
                  <p className="mt-1 font-body text-sm text-studio-violet/70">
                    {labels.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={labels.closeLabel}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-studio-violet text-studio-jaune shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* The table scrolls inside its own container on both axes, so a
                narrow phone never makes the page itself scroll sideways. */}
            <div className="scrollbar-thin mt-5 min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6 sm:pb-6 md:px-10">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="w-[38%] bg-studio-beurre pb-3 pr-2 align-bottom font-body text-[10px] uppercase tracking-luxe text-studio-violet/60 sm:pr-4 sm:text-h5"
                    >
                      {labels.featureHeader}
                    </th>
                    {plans.map((plan) => {
                      const isHighlighted = plan.id === highlightedPlanId;
                      return (
                        <th
                          key={plan.id}
                          scope="col"
                          className={cn(
                            "rounded-t-xl px-1.5 pb-3 pt-3 text-center align-bottom sm:px-4 sm:pb-4 sm:pt-4",
                            isHighlighted
                              ? "bg-studio-jaune"
                              : "bg-studio-lavande/25",
                          )}
                        >
                          <span className="block font-heading text-xs leading-tight text-studio-violet sm:text-lg">
                            {plan.name}
                          </span>
                          <span className="mt-1 block font-heading text-sm text-studio-violet sm:text-xl">
                            {plan.price}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.key}
                      className={i % 2 === 1 ? "bg-studio-lavande/10" : undefined}
                    >
                      <th
                        scope="row"
                        className="py-3 pr-2 font-body text-xs font-normal leading-snug text-studio-violet sm:pr-4 sm:text-sm"
                      >
                        {row.label}
                      </th>
                      {plans.map((plan) => {
                        const value = row[
                          plan.id as "signature" | "sur-mesure" | "prestige"
                        ];
                        return (
                          <td key={plan.id} className="px-1.5 py-3 text-center sm:px-4">
                            {value === "inc" ? (
                              <>
                                <Check
                                  className="mx-auto h-4 w-4 text-studio-violet"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">
                                  {labels.included}
                                </span>
                              </>
                            ) : value === "no" || value === "opt" ? (
                              <>
                                <Minus
                                  className="mx-auto h-4 w-4 text-studio-violet/30"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">
                                  {labels.excluded}
                                </span>
                              </>
                            ) : (
                              /* A sentence rather than a state — printed as
                                 written. Before this, anything that was not
                                 exactly "inc" fell through to the dash, so a
                                 row saying "4 modules, then €5 each" read as
                                 "not included". */
                              <span className="font-body text-xs leading-snug text-studio-violet">
                                {value}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pinned outside the scroll area so the CTAs stay reachable
                without scrolling the whole matrix. The 38% spacer matches the
                feature column, keeping each button under its own plan. */}
            <div className="shrink-0 border-t border-studio-violet/10 bg-studio-beurre px-4 pb-6 pt-4 sm:px-6 md:px-10">
              {/* Same table-fixed geometry as the matrix above, so each CTA
                  lands exactly under its column rather than approximately. */}
              <table className="w-full table-fixed border-collapse">
                <tbody>
                  <tr>
                    <td className="w-[38%]" aria-hidden="true" />
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-1.5 sm:px-4">
                        <Button
                          variant={
                            plan.id === highlightedPlanId
                              ? "studio-violet"
                              : "studio-outline"
                          }
                          size="sm"
                          className={cn(
                            "w-full px-1 text-[10px] uppercase tracking-luxe sm:px-3 sm:text-xs",
                            plan.id !== highlightedPlanId &&
                              "border-studio-violet/30 text-studio-violet hover:bg-studio-violet/10",
                          )}
                          asChild
                        >
                          <Link href={`/studio/start?plan=${plan.id}`}>
                            {labels.choose}
                          </Link>
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
