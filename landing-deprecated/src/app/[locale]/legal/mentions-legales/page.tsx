import { Link } from "@/navigation";

export default function MentionsLegalesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Retour à l'accueil
        </Link>
      </div>

      <h1 className="font-heading text-4xl mb-8">Mentions Légales</h1>
      <p className="text-sm text-muted-foreground mb-12">
        Dernière mise à jour : 31 mars 2026
      </p>

      <div className="space-y-10 text-sm leading-relaxed text-foreground/80">

        {/* Éditeur */}
        <section>
          <h2 className="font-heading text-xl font-bold text-foreground mb-3">
            1. Éditeur du site
          </h2>
          <p>Le site <strong>thestudiopapeteriedigitale.com</strong> est édité par :</p>
          <ul className="mt-3 space-y-1 pl-4">
            <li><strong>Raison sociale :</strong> The Studio Papeterie Digitale</li>
            <li><strong>Siège social :</strong> Paris, France</li>
            <li><strong>Email :</strong>{" "}
              <a
                href="mailto:contact@thestudiopapeteriedigitale.com"
                className="text-primary hover:underline"
              >
                contact@thestudiopapeteriedigitale.com
              </a>
            </li>
            <li><strong>Directeur de la publication :</strong> The Studio Papeterie Digitale</li>
          </ul>
        </section>

        {/* Hébergeur */}
        <section>
          <h2 className="font-heading text-xl font-bold text-foreground mb-3">
            2. Hébergeur
          </h2>
          <p>Le site est hébergé par :</p>
          <ul className="mt-3 space-y-1 pl-4">
            <li><strong>Société :</strong> Vercel Inc.</li>
            <li><strong>Adresse :</strong> 340 Pine Street Suite 701, San Francisco, CA 94104, États-Unis</li>
            <li><strong>Site web :</strong>{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                vercel.com
              </a>
            </li>
          </ul>
        </section>

        {/* Propriété intellectuelle */}
        <section>
          <h2 className="font-heading text-xl font-bold text-foreground mb-3">
            3. Propriété intellectuelle
          </h2>
          <p>
            L'ensemble des contenus présents sur ce site (textes, images, graphismes, logo, icônes,
            animations) est la propriété exclusive de The Studio Papeterie Digitale, sauf mention
            contraire. Toute reproduction, distribution, modification ou utilisation sans
            autorisation préalable est interdite.
          </p>
        </section>

        {/* Données personnelles */}
        <section>
          <h2 className="font-heading text-xl font-bold text-foreground mb-3">
            4. Données personnelles
          </h2>
          <p>
            La collecte et le traitement des données personnelles sont décrits dans notre{" "}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Politique de Confidentialité
            </Link>
            , conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
            Informatique et Libertés.
          </p>
          <p className="mt-2">
            Pour exercer vos droits (accès, rectification, suppression, opposition), contactez-nous à{" "}
            <a
              href="mailto:contact@thestudiopapeteriedigitale.com"
              className="text-primary hover:underline"
            >
              contact@thestudiopapeteriedigitale.com
            </a>
            .
          </p>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="font-heading text-xl font-bold text-foreground mb-3">
            5. Cookies
          </h2>
          <p>
            Ce site utilise des cookies pour mesurer l'audience (Vercel Analytics) et améliorer
            l'expérience utilisateur. Vous pouvez accepter ou refuser les cookies non essentiels
            via la bannière affichée lors de votre première visite.
          </p>
        </section>

        {/* Responsabilité */}
        <section>
          <h2 className="font-heading text-xl font-bold text-foreground mb-3">
            6. Limitation de responsabilité
          </h2>
          <p>
            The Studio Papeterie Digitale s'efforce de maintenir les informations de ce site
            à jour et exactes. Cependant, nous ne pouvons garantir l'exactitude, la complétude
            ou l'actualité des informations diffusées. L'utilisation des informations du site
            est sous la seule responsabilité de l'utilisateur.
          </p>
        </section>

        {/* Droit applicable */}
        <section>
          <h2 className="font-heading text-xl font-bold text-foreground mb-3">
            7. Droit applicable
          </h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige,
            les tribunaux français seront seuls compétents.
          </p>
        </section>

      </div>
    </div>
  );
}
