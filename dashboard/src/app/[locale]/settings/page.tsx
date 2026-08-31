import { getProfile, getSettings } from "@/actions/settings-actions";
import DeleteAccountDialog from "@/components/dashboard/DeleteAccountDialog";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import ProfileSettings from "@/components/dashboard/ProfileSettings";
import SecuritySettings from "@/components/dashboard/SecuritySettings";
import SettingsForm from "@/components/dashboard/SettingsForm";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@shared/components/ui/tabs";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale: "fr" });
  }

  // Fetch settings & profile
  const settings = await getSettings();
  const profile = await getProfile();
  const t = await getTranslations("Settings");

  return (
    <div className='p-8 md:p-12 max-w-4xl mx-auto space-y-8 pb-32'>
      <header className='pb-8 border-b border-studio-lavande/30'>
        <h1 className='font-heading text-h1 text-studio-violet'>
          {t("title")}
        </h1>
        <p className='text-muted-foreground mt-2'>{t("subtitle")}</p>
      </header>

      <Tabs
        defaultValue='general'
        className='w-full'
      >
        <TabsList className='mb-8'>
          <TabsTrigger value='general'>{t("tabs.general")}</TabsTrigger>
          <TabsTrigger value='profile'>{t("tabs.profile")}</TabsTrigger>
          <TabsTrigger value='security'>{t("tabs.security")}</TabsTrigger>
        </TabsList>

        <TabsContent
          value='general'
          className='space-y-8'
        >
          <section className='bg-card p-6 rounded-2xl border border-studio-lavande/40 shadow-sm'>
            <h2 className='text-xl font-heading mb-4'>
              {t("general.wedding_config_title")}
            </h2>
            <p className='text-sm text-muted-foreground mb-6'>
              {t("general.wedding_config_desc")}
            </p>
            <SettingsForm initialSettings={settings} />
          </section>

          <section className='bg-card p-6 rounded-2xl border border-studio-lavande/40 shadow-sm'>
            <h2 className='text-xl font-heading mb-4'>
              {t("general.language_title")}
            </h2>
            <p className='text-sm text-muted-foreground mb-6'>
              {t("general.language_desc")}
            </p>
            <div className='max-w-md'>
              <LanguageSwitcher />
            </div>
          </section>
        </TabsContent>

        <TabsContent
          value='profile'
          className='space-y-8'
        >
          <ProfileSettings profile={profile} />
        </TabsContent>

        <TabsContent
          value='security'
          className='space-y-8'
        >
          <SecuritySettings />

          <DeleteAccountDialog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
