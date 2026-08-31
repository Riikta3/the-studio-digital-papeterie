import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "warning" | "success";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  action?: {
    label: string;
    href: string;
  };
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  variant = "default",
  trend,
  action,
}: StatCardProps) {
  const variantStyles = {
    default: {
      card: "bg-white border-studio-lavande/40 hover:border-studio-violet/50",
      icon: "bg-studio-violet/10 text-studio-violet",
      label: "text-studio-violet/60",
      value: "text-studio-violet",
    },
    primary: {
      card: "bg-studio-violet text-white border-studio-violet",
      icon: "bg-white/10 text-white",
      label: "text-white/70",
      value: "text-white",
    },
    warning: {
      card: "bg-white border-studio-jaune",
      icon: "bg-studio-jaune text-studio-violet",
      label: "text-studio-pourpre",
      value: "text-studio-violet",
    },
    success: {
      card: "bg-white border-teal-200",
      icon: "bg-teal-100 text-teal-600",
      label: "text-teal-600",
      value: "text-studio-violet",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`relative p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md ${styles.card} overflow-hidden group`}
    >
      {/* Decorative element */}
      <div className='absolute right-0 top-0 opacity-[0.04] group-hover:scale-110 transition-transform duration-700 pointer-events-none'>
        <Icon size={40} />
      </div>

      {/* Header */}
      <div className='flex justify-between items-start  relative z-10'>
        <span
          className={`uppercase tracking-wider text-xs font-medium ${styles.label}`}
        >
          {label}
        </span>
        <div className={`p-2 rounded-full ${styles.icon}`}>
          <Icon size={18} />
        </div>
      </div>

      {/* Value */}
      <div className='relative z-10 mb-2'>
        <div
          className={`text-4xl md:text-5xl font-heading font-light ${styles.value}`}
        >
          {value}
        </div>
        {description && (
          <div
            className={`text-sm mt-2 font-light ${variant === "default" ? "text-muted-foreground" : styles.label}`}
          >
            {description}
          </div>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className='relative z-10 flex items-center gap-1 text-xs mt-3'>
          <span
            className={trend.isPositive ? "text-teal-500" : "text-red-600"}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className='text-muted-foreground'>vs. semaine précédente</span>
        </div>
      )}

      {/* Action */}
      {action && (
        <div
          className={`pt-4 mt-4 border-t relative z-10 ${variant === "primary" ? "border-white/10" : "border-border"}`}
        >
          <a
            href={action.href}
            className={`text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all ${
              variant === "primary"
                ? "text-primary-foreground/90 hover:text-primary-foreground"
                : "text-primary hover:text-primary/80"
            }`}
          >
            {action.label}
            <svg
              className='w-4 h-4 transition-transform group-hover:translate-x-1'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
