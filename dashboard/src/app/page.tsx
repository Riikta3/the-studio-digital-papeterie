import { Button } from "@shared/components/ui/button";

export default function DashboardHome() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8'>
      <div className='max-w-md w-full space-y-8 text-center'>
        <div className='flex flex-col items-center space-y-2'>
          <h1 className='text-4xl font-heading text-primary'>The Studio</h1>
          <p className='text-muted-foreground tracking-supertitle text-xs uppercase'>
            Digital Papeterie
          </p>
        </div>

        <div className='glass-card p-8 rounded-xl space-y-6'>
          <h2 className='text-2xl font-heading'>Bienvenue sur votre Espace</h2>
          <p className='text-sm text-gray-600'>
            Connectez-vous pour gérer votre mariage, vos invités et vos plans de
            table avec élégance.
          </p>
          <div className='pt-4'>
            <Button
              className='w-full'
              size='lg'
            >
              Se connecter
            </Button>
          </div>
        </div>

        <div className='flex justify-center gap-4 text-xs text-muted-foreground'>
          <span>Sécurité</span>
          <span>•</span>
          <span>Confidentialité</span>
          <span>•</span>
          <span>Support</span>
        </div>
      </div>
    </div>
  );
}
