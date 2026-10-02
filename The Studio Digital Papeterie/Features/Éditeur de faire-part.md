---
date: 2026-09-27
status: actif
category: Features
---

# Éditeur de faire-part

Un seul écran, `/invitation` dans le dashboard, pour modifier **tout** ce que le
faire-part affiche, avec l'aperçu en direct du vrai thème du couple à côté.

Il remplace neuf écrans qui s'ignoraient : `/modules/[id]` (un formulaire par
module, avec une maquette générique en guise d'aperçu), « Nos mots »,
« Événements », « Programme », « Lieu », « FAQ ». Les anciennes adresses
redirigent vers le bon onglet.

Spec : `docs/superpowers/specs/2026-09-27-invitation-editor-design.md`.
Plan : `docs/superpowers/plans/2026-09-27-invitation-editor.md`.

Voir aussi [[Invitation]], [[Checklist nouveau thème]], [[Base de Données]],
[[Conventions]].

## L'écran

- **Plein écran** : la sidebar s'efface (un formulaire, un téléphone et seize
  onglets ne tiennent pas à côté de 256 px sur un portable). L'en-tête garde un
  retour « Tableau de bord ».
- **Onglets = sections du faire-part**, dans l'ordre où le thème les dessine
  (l'aperçu renvoie cet ordre). L'accueil et le pied de page toujours, puis un
  onglet par module acheté, **les quinze modules vendus au checkout**, même ceux
  que le thème ne dessine pas.
- Pastilles sur les onglets : modifié (ambre), erreur (rouge), invisible sur le
  faire-part (œil barré, avec la raison dans l'onglet : le thème ne dessine pas
  ce module, ou la section est vide).
- « + Ajouter un module » en bout de barre → le catalogue `/modules`.
- L'onglet actif est dans l'URL (`?section=faq`), sans aller-retour serveur.
- Mobile : chips défilantes, formulaire pleine largeur, bouton « Aperçu »
  flottant qui ouvre l'aperçu en plein écran.

## Enregistrement

Un brouillon pour tout le faire-part, **un seul bouton « Enregistrer »**
(⌘S), « Annuler » pour tout jeter, alerte en quittant avec des modifications.
Pas d'autosave : le faire-part est en ligne dès l'achat, un autosave publierait
des phrases à moitié tapées.

`saveInvitationDraft` reçoit seulement les parties modifiées, valide chaque
champ côté serveur, écrit partie par partie (une erreur sur la FAQ ne défait pas
le lieu enregistré juste avant) et renvoie l'état relu. Les listes (événements,
moments, hébergements, FAQ) s'enregistrent par différence.

## L'aperçu

Une iframe sur la landing, `/[locale]/invitation/apercu` — un **pur moteur de
rendu** : elle ne lit aucune base. Le dashboard lui envoie le brouillon par
`postMessage`, **au format des lignes de la base** (`InvitationRows`), et
l'aperçu le passe dans `assembleInvitationPage()` → `toInvitationData()` → le
`Root` du thème. Exactement le chemin de la page publique : ce qu'on voit est ce
que verront les invités.

Protocole (`shared/types/editor-preview.ts`) : `preview:ready`,
`editor:render`, `preview:rendered` (sections présentes, textes du thème),
`editor:focus` (défiler vers l'onglet ouvert), `preview:select` (clic dans
l'aperçu → onglet).

Formulaires invités en mode démo dans l'aperçu (`weddingId` retiré).

## Les mots du thème (« slots »)

Chaque mot que le thème imprime de sa propre voix est réécrivable : « La dolce
vita commence dans », « Dress code · Jour 2 », le tampon « ITALIA ». Beaucoup de
ces textes étaient faux pour la plupart des mariages (« Deux jours
d'exception » sur un mariage d'un jour).

- Déclarés par le thème dans `themes/<id>/editor.ts`, clé
  `<section>.<rôle>`.
- Le thème lit `slot(data, clé) ?? t(...)`.
- Les valeurs par défaut viennent de l'aperçu, dans la langue du faire-part,
  affichées en placeholder : le dashboard ne connaît aucun thème.
- Stockés dans `settings.invitation_texts` (voir [[Base de Données]]).

## Sécurité

- L'aperçu n'écoute que les origines du dashboard (`src/lib/editor-origins.mjs`)
  et n'est encadrable que par elles (`frame-ancestors`). Le dashboard n'envoie
  qu'à l'origine de la landing.
- Tout lien saisi devient un `href` public : seuls les liens http(s) passent
  (`normaliseUserUrl` à l'enregistrement, `safeUrl` au rendu). Un
  `javascript:` dans le lien Waze serait du script exécuté chez chaque invité.
- Les configs de module ne s'écrivent que pour les modules achetés
  (`updateModuleConfig` insérait une ligne pour n'importe quel id).

## Pièges rencontrés

- **Une section `async` casse l'aperçu** : le `Root` y est rendu côté client.
  Les douze sections async des thèmes sont devenues isomorphes
  (`useTranslations` / `useLocale`).
- **L'iframe se rechargeait au premier rendu** : le panneau montait deux arbres
  différents selon la largeur. Un seul arbre, seuls les styles changent.
- **Onglets et animation** : pendant le fondu entre deux onglets, les deux
  formulaires coexistent 160 ms — un test qui cherche un libellé commun
  (« Sur-titre ») peut viser le mauvais. Attendre qu'un seul `h2` soit affiché.
- **`resolve_public_slug` avait perdu `languages`** (recréée par
  20260912140000 sans la colonne) : la garde de langue du faire-part ne faisait
  plus rien. Rétablie par la migration de l'éditeur.
- **La base doit précéder le code** : la migration de l'éditeur est en prod depuis le 28/09, avant tout merge. Sans elle, le code ferait disparaître le programme et les hébergements des faire-part sans erreur, car la page publique prend une requête en échec pour une liste vide. Voir [[Colonne invitation_texts absente en prod]].
- **L'aperçu n'est pas le lien public** : l'aperçu doit tourner sur le même code que l'éditeur, alors que « Voir mon faire-part » doit pointer là où les invités lisent le faire-part. Les deux lisaient `NEXT_PUBLIC_LANDING_URL` : avec un `.env.local` pointé sur Vercel, l'aperçu affichait la 404 du déploiement. L'aperçu passe désormais par `dashboard/src/lib/editor-preview-url.ts` (iframe et `frame-src`) : `EDITOR_PREVIEW_URL` si elle est définie, `http://localhost:3010` hors production, sinon `NEXT_PUBLIC_LANDING_URL`. Aucune variable à passer en dev.
- **Un champ qui ne change rien** est un champ que le thème oublie. Au 28/09, Ciao Amore dessine tous ceux de l'éditeur, et le contrat porte les événements (`events`). Voir [[Champs de l'éditeur sans effet]].

## Navigation : le sommaire (2026-10-02)
- Les onglets du haut étaient trop discrets, et « Ajouter un module » (un petit bouton en pointillés) passait inaperçu. Sur maquette cliquable, l'utilisateur a choisi la **variante B, le sommaire**, sur ordinateur comme sur téléphone.
- **Ordinateur** (`SectionRail`) : une colonne à gauche du formulaire (à droite en arabe) avec « Votre faire-part » et trois groupes : le faire-part (Accueil), vos modules dans l'ordre du thème, la fin (Pied de page). Chaque ligne a son icône et son état (prix, « Inclus », « À régler », modifié, erreur, absent de l'aperçu). En bas, « Ajouter un module » est un **bouton plein** avec le nombre de modules disponibles, et son menu s'ouvre à côté.
- **Téléphone** (`SectionSwitcher`) : un sélecteur « Section 3 sur 8 » avec des flèches précédent/suivant ; le toucher ouvre le même sommaire en feuille (`BottomSheet`), avec « Ajouter un module » au pied.
- Clavier : flèches haut/bas et Début/Fin dans la colonne, comme les anciens onglets.
- Code : `SectionNav.tsx` (remplace `SectionTabs.tsx`), `section-nav.ts` (fonctions sans effet de bord, testées), `AddModuleMenu.tsx` (liste commune, menu flottant depuis la colonne, feuille sur téléphone).
- Voir [[Achat de modules]].

## Palette du Dress code : sélecteur avec validation (2026-10-02)
- Demande : « quand je clique il faut une validation et pouvoir aussi mettre un # ». Le `<input type=color>` natif changeait la couleur à chaque mouvement et ne prenait pas de code.
- Une pastille ou « + » ouvre une petite fenêtre : nuancier (`react-colorful`, environ 2 Ko, MIT), champ « Code couleur » qui accepte `#E7BDC6`, `E7BDC6` ou `#ABC`, puis **Annuler / Valider**. Rien ne change dans la palette ni dans l'aperçu avant « Valider ». Entrée valide, Échap ou un clic à côté annulent.
- Un code invalide affiche un message et grise « Valider ». On enregistre toujours `#rrggbb` en minuscules (`fields/color.ts`, testé) ; le serveur accepte aussi rgb() et hsl() (`validate.ts`).
- Code : `fields/ColorPaletteField.tsx`.

## Configuration repliable (2026-10-02)
- Demande : « une icône pour afficher ou non la partie où il y a la config, pas le sommaire ».
- Sur ordinateur, une poignée « ‹ » posée sur le bord de la colonne de configuration la replie. Il reste une bande fine (icône + « Configuration » écrit à la verticale) qui la rouvre. Le sommaire et l'aperçu restent, et l'aperçu prend la place.
- La largeur glisse en 300 ms, et le formulaire garde sa largeur à l'intérieur, donc rien ne se réorganise pendant l'animation. Le sommaire continue de piloter l'aperçu quand la colonne est repliée.
- Pas sur téléphone, où l'aperçu s'ouvre déjà en plein écran. En arabe, la poignée et la bande passent du côté opposé.
- Code : `InvitationEditor.tsx` (état `settingsOpen`).
- 2026-10-02, retour : « le bouton n'est pas assez visible ». La poignée est passée d'un rond blanc bordé de lavande, qui se perdait contre le trait, à un **rond violet plein** de 36 px, chevron blanc, détaché du trait par un anneau crème. Son nom apparaît au survol. La bande repliée montre le même rond violet avec « › ».
- 2026-10-02, retour : « il faut une légère animation quand ça close ». À la fermeture, le formulaire ne disparaît plus d'un coup. Il passe en fondu (300 ms, `opacity` + `visibility`) pendant que la colonne se resserre dessus, et ne quitte l'ordre de tabulation qu'à la fin. Poignée et bande s'échangent en fondu enchaîné (la poignée part tout de suite, la bande arrive après 200 ms, et l'inverse à l'ouverture). Tout est coupé si le système demande moins d'animations (`motion-reduce`). Piège : `display:none` ne s'anime pas, alors que `visibility` bascule seulement en fin de transition.