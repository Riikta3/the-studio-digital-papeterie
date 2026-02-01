import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("Common");

  return (
    <div className='container mx-auto px-4 py-24 max-w-4xl'>
      <h1 className='font-heading text-4xl font-bold mb-8'>
        Politique de Confidentialité
      </h1>

      <div className='prose prose-stone dark:prose-invert max-w-none'>
        <div className='bg-muted/50 p-6 rounded-lg border border-border'>
          <h2 className='text-xl font-semibold mb-4'>Page en construction</h2>
          <p className='mb-4'>
            Cette page doit contenir vos mentions légales et votre politique de
            confidentialité conformément au RGPD.
          </p>
          <p>
            Veuillez consulter le fichier <code>GUIDE_RGPD.md</code> à la racine
            du projet pour savoir quelles informations doivent figurer ici.
          </p>
        </div>
      </div>
    </div>
  );
}
