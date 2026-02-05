import { getSettings } from "@/actions/settings-actions";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";

// We'll make a Client Component for the form to handle Toasts easily
import SettingsForm from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale: "fr" });
  }

  // Fetch settings
  const settings = await getSettings();

  // If no settings exist (should be created on signup ideally), create default?
  // Or handle null.

  return (
    <div className='p-8 md:p-12 max-w-4xl mx-auto space-y-8'>
      <header className='pb-8 border-b border-border'>
        <h1 className='text-4xl font-heading font-light text-foreground'>
          Réglages
        </h1>
        <p className='text-muted-foreground mt-2'>
          Configurez votre mariage et l&apos;accès invités.
        </p>
      </header>

      <div className='grid gap-8'>
        <section className='bg-card p-6 rounded-xl border border-border shadow-sm'>
          <h2 className='text-xl font-heading mb-4'>Code Mariage (RSVP)</h2>
          <p className='text-sm text-muted-foreground mb-6'>
            Ce code est nécessaire pour que vos invités puissent accéder au
            formulaire de réponse. Partagez-le sur vos faire-parts.
          </p>

          <SettingsForm initialSettings={settings} />
        </section>
      </div>
    </div>
  );
}
