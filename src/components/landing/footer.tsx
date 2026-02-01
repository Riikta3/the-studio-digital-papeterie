import { Link } from "@/navigation";

export function Footer() {
  return (
    <footer className='border-t border-border/40 bg-background/50 py-12 backdrop-blur-sm'>
      <div className='container mx-auto px-4'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div className='space-y-4'>
            <h3 className='font-heading text-xl font-bold'>
              The Studio Digital Papeterie
            </h3>
            <p className='text-sm text-muted-foreground'>
              L'alliance parfaite entre tradition et modernité. Vos invitations
              de mariage, sublimées par le digital.
            </p>
          </div>

          <div>
            <h4 className='mb-4 font-semibold'>Produit</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link
                  href='/#fonctionnalites'
                  className='hover:text-primary'
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link
                  href='/#modeles'
                  className='hover:text-primary'
                >
                  Thèmes
                </Link>
              </li>
              <li>
                <Link
                  href='/#tarifs'
                  className='hover:text-primary'
                >
                  Tarifs
                </Link>
              </li>
              <li>
                <Link
                  href='/#modeles'
                  className='hover:text-primary'
                >
                  Exemples
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 font-semibold'>Support</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link
                  href='/#faq'
                  className='hover:text-primary'
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href='mailto:hello@thestudio.com'
                  className='hover:text-primary'
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href='/legal/cgv'
                  className='hover:text-primary'
                >
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link
                  href='/legal/privacy'
                  className='hover:text-primary'
                >
                  Politique de Confidentialité
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 font-semibold'>Réseaux</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link
                  href='https://instagram.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-primary'
                >
                  Instagram
                </Link>
              </li>
              <li>
                <Link
                  href='https://pinterest.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-primary'
                >
                  Pinterest
                </Link>
              </li>
              <li>
                <Link
                  href='https://tiktok.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-primary'
                >
                  TikTok
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-12 flex flex-col items-center justify-between border-t border-border/40 pt-8 text-xs text-muted-foreground md:flex-row'>
          <p>
            &copy; {new Date().getFullYear()} The Studio Digital Papeterie. Tous
            droits réservés.
          </p>
          <div className='mt-4 flex gap-4 md:mt-0'>
            <span>Fait avec amour à Paris</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
