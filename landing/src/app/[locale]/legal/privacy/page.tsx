import { Link } from "@/navigation";

export default function PrivacyPage() {
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
        Politique de Confidentialité
      </h1>
      <p className='text-sm text-muted-foreground mb-8'>
        Dernière mise à jour : {new Date().toLocaleDateString()}
      </p>

      <div className='prose prose-gray max-w-none space-y-8'>
        <section>
          <p>
            The Studio Papeterie Digital s'engage à ce que la collecte et le
            traitement de vos données, effectués à partir du site, soient
            conformes au règlement général sur la protection des données (RGPD)
            et à la loi Informatique et Libertés.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>1. Données collectées</h2>
          <p>
            Nous limitons la collecte des données personnelles au strict
            nécessaire (minimisation des données). Nous pouvons collecter :
          </p>
          <ul className='list-disc pl-5 mt-2 space-y-1'>
            <li>
              <strong>Données d'identité :</strong> Nom, prénom (pour la
              facturation et la personnalisation).
            </li>
            <li>
              <strong>Données de contact :</strong> Adresse email, numéro de
              téléphone, adresse postale.
            </li>
            <li>
              <strong>Données de l'événement :</strong> Date, noms des mariés,
              lieux.
            </li>
            <li>
              <strong>Données techniques :</strong> Cookies essentiels au
              fonctionnement du site.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>2. Finalités du traitement</h2>
          <p>Vos données sont traitées pour les finalités suivantes :</p>
          <ul className='list-disc pl-5 mt-2 space-y-1'>
            <li>
              Gestion et livraison de votre commande de papeterie digitale.
            </li>
            <li>Établissement des factures.</li>
            <li>Relation client et support technique.</li>
            <li>Amélioration de nos services.</li>
          </ul>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>
            3. Destinataires des données
          </h2>
          <p>
            Vos données ne sont jamais vendues à des tiers. Elles peuvent être
            transmises à nos sous-traitants pour l'exécution des services :
          </p>
          <ul className='list-disc pl-5 mt-2 space-y-1'>
            <li>
              <strong>Stripe :</strong> Pour la gestion sécurisée des paiements.
            </li>
            <li>
              <strong>Vercel :</strong> Pour l'hébergement du site.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>4. Durée de conservation</h2>
          <p>
            Vos données personnelles sont conservées le temps nécessaire à
            l'accomplissement de l'objectif poursuivi lors de leur collecte (ex:
            durée de vie de votre site de mariage), puis archivées conformément
            aux obligations légales (ex: 10 ans pour les factures).
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>5. Vos droits</h2>
          <p>
            Conformément à la réglementation, vous disposez d'un droit d'accès,
            de rectification, de suppression et d'opposition sur vos données
            personnelles.
          </p>
          <p className='mt-2'>
            Pour exercer ces droits, vous pouvez nous contacter par email ou via
            le formulaire de contact du site.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-bold mb-4'>6. Cookies</h2>
          <p>
            Lors de votre première visite, un bandeau vous informe de la
            présence de cookies et vous invite à indiquer votre choix. Nous
            utilisons des cookies pour :
          </p>
          <ul className='list-disc pl-5 mt-2 space-y-1'>
            <li>Le fonctionnement technique du site (panier, session).</li>
            <li>La mesure d'audience (anonymisée).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
