---
date: 2026-09-28
status: resolved
category: bug
---

# Champs de l'éditeur sans effet sur le faire-part

## Symptôme
Dans l'éditeur (`/invitation`), plusieurs champs ne changeaient rien dans l'aperçu : la photo du pied de page, les événements du programme, le monogramme. Un audit de tous les formulaires en a trouvé d'autres.

## Cause
L'éditeur proposait des champs que le contrat des thèmes (`InvitationData`) ou Ciao Amore ne dessinait pas :
- **Contrat** : aucune liste d'événements. Le mapper ne retenait que l'heure de la cérémonie (compte à rebours) et le brunch (bloc du lendemain). Le nom, la date, l'heure, l'adresse, la description et la tenue d'un événement n'arrivaient dans aucun thème.
- **Ciao Amore** ignorait `couple.portrait`, `couple.monogram` et `copy.rsvpIntro`, les moments du brunch, et la ville, le téléphone, l'offre et la photo d'un hôtel (les hôtels secondaires n'affichaient que nom et distance). Il ignorait aussi la ville du lieu (onglet Lieu) et le libellé du lien de covoiturage.
- **Aperçu** : un lien sans `https://` (« www.… ») y disparaissait, alors que l'enregistrement le complète. Un clic sur les indications d'accès ouvrait l'onglet Transports même quand le module n'était pas acheté.
- **Clés React** : deux pastilles de couleur identiques avaient la même clé.

## Correctif
- Contrat : `events` (`WeddingEvent`), `ScheduleEntry.event`, `Stay.phone`, `Venue.access[].link`. Le programme est rattaché à la clé de son événement, pas à son nom (deux événements de même nom échangeaient leurs moments).
- Ciao Amore :
  - monogramme en texte discret en haut de l'accueil, affiché seulement s'il est écrit (vider le champ le retire ; le mapper ne déduit plus les initiales) ;
  - portrait en médaillon dans le pied de page ;
  - carte par événement avant ses moments ;
  - brunch avec adresse, tenue et moments (pictogrammes compris), et carte ancrée au niveau du transat quel que soit son contenu (elle était alignée en bas : une carte courte tombait loin sous le transat) ;
  - hôtels complets, et cadre pour les cartes sans lien ;
  - introduction du RSVP ;
  - ville du lieu ;
  - lien de covoiturage avec son libellé ;
  - heure de la cérémonie dans l'accueil, si elle a été saisie.
- Aperçu : les liens sont normalisés comme à l'enregistrement (`to-preview-rows.ts`, `MODULE_LINK_KEYS`, testé contre `cleanModuleConfig`). Un clic remonte à la première section dont le couple a l'onglet.
- Vérifié : 86 tests ; tsc des deux apps ; harnais Playwright qui pilote `/invitation/apercu` comme le dashboard, avec captures à 390 et 1280 px. Contrôle en lecture seule dans l'éditeur réel.

## Leçons
- **Chaque champ de l'éditeur doit changer l'aperçu, dans la section de son onglet.** La checklist de `themes/README.md` le dit maintenant, avec la liste des champs que les thèmes oublient.
- **Tester l'aperçu sans base** : servir une page parente sur `http://localhost:3003` par `page.route` (Playwright) et poster les lignes comme le dashboard. Chrome bloque alors l'iframe locale (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`) : il faut lancer le navigateur de test avec `--disable-features=LocalNetworkAccessChecks`.
- **Reste à faire** :
  - le bloc du brunch est rendu après le programme, et l'aperçu défile jusqu'au premier élément `timeline` : une modification du brunch tombe hors de l'écran ;
  - le sur-titre par défaut « Nous nous marions » est en français quelle que soit la langue ;
  - belle-rive et blanc-couture ne dessinent pas encore les événements.

Voir [[Éditeur de faire-part]].