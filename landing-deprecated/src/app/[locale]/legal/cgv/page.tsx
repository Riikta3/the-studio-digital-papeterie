import { Link } from "@/navigation";

export default function CGVPage() {
  return (
    <div className='container mx-auto px-4 py-12 max-w-4xl'>
      <div className='mb-8'>
        <Link
          href='/'
          className='text-sm text-muted-foreground hover:text-primary transition-colors'
        >
          ← Retour à l'accueil
        </Link>
      </div>

      <h1 className='font-heading text-4xl mb-8'>
        Conditions Générales de Vente
      </h1>
      <p className='text-sm text-muted-foreground mb-8'>
        Dernière mise à jour : {new Date().toLocaleDateString()}
      </p>

      <div className='prose prose-gray max-w-none space-y-8'>
        <section>
          <h2 className='text-xl font-bold mb-4'>1. Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les
            relations contractuelles entre{" "}
            <strong>The Studio Papeterie Digital</strong> (ci-après "le
            Vendeur") et toute personne physique ou morale (ci-après "le
            Client") souhaitant effectuer un achat via le site internet.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>2. Produits et Services</h2>
          <p>
            Le Vendeur propose la création de papeterie digitale personnalisée
            (faire-part de mariage, sites web événementiels). Les
            caractéristiques essentielles des produits sont présentées sur le
            site.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>3. Prix</h2>
          <p>
            Les prix sont indiqués en Euros (€) toutes taxes comprises (TTC). Le
            Vendeur se réserve le droit de modifier ses prix à tout moment, mais
            le produit sera facturé sur la base du tarif en vigueur au moment de
            la validation de la commande.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>4. Commande et Paiement</h2>
          <p>
            La validation de la commande entraîne l'acceptation des présentes
            CGV. Le paiement est exigible immédiatement à la commande. Le
            règlement s'effectue par carte bancaire via le système sécurisé{" "}
            <strong>Stripe</strong>.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>
            5. Renonciation au Droit de Rétractation
          </h2>
          <div className='bg-orange-50 p-4 rounded-lg border border-orange-100'>
            <p className='font-semibold text-orange-800 mb-2'>Important :</p>
            <p className='text-orange-900'>
              Conformément à l'article L221-28 du Code de la consommation, le
              droit de rétractation <strong>ne peut être exercé</strong> pour
              les contrats de fourniture de contenu numérique non fourni sur un
              support matériel dont l'exécution a commencé après accord
              préalable exprès du consommateur et renoncement exprès à son droit
              de rétractation.
            </p>
            <p className='text-orange-900 mt-2'>
              En validant sa commande de papeterie digitale personnalisée, le
              Client accepte que la production commence immédiatement et renonce
              expressément à son droit de rétractation.
            </p>
          </div>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>6. Livraison</h2>
          <p>
            Les produits sont livrés sous forme digitale (lien web ou fichier
            téléchargable) à l'adresse email indiquée par le Client lors de la
            commande. Les délais indiqués sont des délais moyens habituels.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>
            7. Propriété Intellectuelle
          </h2>
          <p>
            Tous les éléments du site The Studio Papeterie Digital sont et
            restent la propriété intellectuelle et exclusive du Vendeur. Le
            Client dispose d'un droit d'usage personnel pour son événement, mais
            nul n'est autorisé à reproduire, exploiter, rediffuser, ou utiliser
            à quelque titre que ce soit, même partiellement, des éléments du
            site.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>8. Données Personnelles</h2>
          <p>
            Le Vendeur s'engage à préserver la confidentialité des informations
            fournies par l'acheteur. Ces informations sont nécessaires gestion
            de la commande et à l'établissement des factures. Voir notre
            Politique de Confidentialité pour plus de détails.
          </p>
        </section>
      </div>
    </div>
  );
}
