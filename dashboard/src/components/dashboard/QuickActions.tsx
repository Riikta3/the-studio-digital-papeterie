import { Link } from "@/navigation";
import { FileDown, Mail, Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function QuickActions() {
  const t = await getTranslations("Dashboard");

  const actions = [
    {
      label: t("quick_add_guest"),
      icon: Plus,
      href: "/guests",
      variant: "default",
      description: t("quick_add_desc"),
    },
    {
      label: t("manage_responses"),
      icon: Mail,
      href: "/guests?filter=pending",
      variant: "outline",
      description: t("manage_responses_desc"),
    },
    {
      label: t("guest_list"),
      icon: Users,
      href: "/guests",
      variant: "outline",
      description: t("guest_list_desc"),
    },
    {
      label: t("export_data"),
      icon: FileDown,
      href: "/settings",
      variant: "outline",
      description: t("export_desc"),
    },
  ];

  return (
    <div className='space-y-6 h-[420px] flex flex-col'>
      <div className='flex items-center justify-between'>
        <h2 className='font-heading text-h3 text-studio-violet'>
          {t("quick_access")}
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-4 flex-1'>
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className='group block p-4 bg-white border border-studio-lavande/40 rounded-2xl hover:border-studio-violet/50 hover:shadow-md transition-all duration-300 relative overflow-hidden'
          >
            <div className='flex items-start gap-4 z-10 relative'>
              <div
                className={`p-3 rounded-xl transition-colors ${
                  action.variant === "default"
                    ? "bg-studio-violet text-white group-hover:bg-studio-violet-fonce"
                    : "bg-studio-lavande/20 text-studio-violet group-hover:bg-studio-lavande/30"
                }`}
              >
                <action.icon size={20} />
              </div>
              <div>
                <h3 className='font-medium text-studio-violet group-hover:text-studio-violet-fonce transition-colors'>
                  {action.label}
                </h3>
                <p className='text-sm text-studio-violet/60 mt-1 font-light'>
                  {action.description}
                </p>
              </div>
            </div>

            {/* Hover effect background */}
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-studio-violet/[0.03] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
          </Link>
        ))}
      </div>
    </div>
  );
}
