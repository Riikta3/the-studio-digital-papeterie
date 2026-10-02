---
date: 2026-10-02
status: résolu (local, non commité)
category: bug
---

# Le transat de Ciao Amore cachait la date du Brunch sur téléphone

**Symptôme** : section « Jour 2 · Brunch & Pool Party », sur téléphone (390 px et moins), le transat du parasol passait sur le coin de l'encart et cachait la fin de la date.

**Cause** : `.decor` a `z-index: 3` dans la feuille générée, et `.brunch-card` n'a pas de `z-index`. Sur ordinateur, les deux sont côte à côte, donc le défaut ne se voit qu'en capture téléphone.

**Correction** : `.brunch-card { z-index: 4 }` dans `responsive.css` (la couche écrite à la main ; `ciao-amore.css` est générée). Le transat passe derrière l'encart, le parasol dépasse au-dessus.

**Vérifié** : `themes:shoot` à 390 et 360 px, `themes:check`.

Voir [[Conventions]].