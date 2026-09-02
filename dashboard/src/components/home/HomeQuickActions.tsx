import { Link } from "@/navigation";
import type { LucideIcon } from "lucide-react";
import { Armchair, Mail, QrCode } from "lucide-react";
import { getTranslations } from "next-intl/server";

type Action = {
  key: string;
  icon: LucideIcon;
  href: string;
  count: number;
};

type Props = {
  /** Guests with no RSVP answer yet. */
  noAnswerCount: number;
  /** Confirmed guests not yet assigned to a table. */
  toSeatCount: number;
};

/**
 * Work left to do, derived from real (mock) figures rather than a static
 * list — each tile's count is honest about what remains, and drops out
 * entirely at zero rather than showing a "0 to do" tile.
 */
export async function HomeQuickActions({ noAnswerCount, toSeatCount }: Props) {
  const t = await getTranslations("Dashboard.quick_actions");

  const actions: Action[] = [
    {
      key: "no_answer",
      icon: Mail,
      href: "/rsvp-responses",
      count: noAnswerCount,
    },
    {
      key: "to_seat",
      icon: Armchair,
      href: "/jour-j/plan-de-table",
      count: toSeatCount,
    },
    {
      key: "qr_code",
      icon: QrCode,
      href: "/jour-j/qr-code",
      // Always shown: printing the QR code is a one-off task with no natural
      // "done" count, unlike the other two.
      count: -1,
    },
  ].filter((action) => action.count !== 0);

  if (actions.length === 0) return null;

  return (
    <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card md:p-6'>
      <h2 className='font-heading text-h4 text-studio-violet'>{t("title")}</h2>

      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className='flex min-h-11 items-center gap-3 rounded-xl bg-studio-creme p-3 transition-colors hover:bg-studio-lavande/20'
          >
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-studio-violet'>
              <action.icon className='h-4 w-4' />
            </span>
            <span className='min-w-0'>
              <span className='block truncate text-sm font-medium text-studio-violet'>
                {action.count >= 0
                  ? t(`${action.key}.label`, { count: action.count })
                  : t(`${action.key}.label_no_count`)}
              </span>
              <span className='block truncate text-xs text-studio-violet/60'>
                {t(`${action.key}.description`)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
