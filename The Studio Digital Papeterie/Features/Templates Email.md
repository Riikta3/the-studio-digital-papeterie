

## Changement d'adresse email (branché)

`updateEmail` (`dashboard/src/actions/settings-actions.ts`) appelait
`supabase.auth.updateUser({ email })`, ce qui laissait **Supabase** envoyer le
mail avec son propre template : non traduit, hors DA, et soumis au rate limit du
SMTP partagé. C'était le dernier chemin qui échappait à nos templates.

Passe maintenant par `sendAuthEmail`, comme le reset password.

### Double confirmation

`secure_email_change_enabled` (défaut `true`, désormais explicite dans
`config.toml`) fait exiger par Supabase une confirmation depuis **l'ancienne
adresse ET la nouvelle** — une session volée ne peut pas déplacer le compte vers
une boîte que le propriétaire ne contrôle pas.

Le kind `change` a donc été scindé en deux :

| Kind | Type Supabase | Destinataire |
|---|---|---|
| `change_current` | `email_change_current` | adresse **actuelle** |
| `change_new` | `email_change_new` | adresse **nouvelle** |

Piège corrigé au passage : `sendAuthEmail` envoyait à `input.to` sans condition,
ce qui aurait déposé les deux liens dans l'ancienne boîte et annulé tout
l'intérêt de la double confirmation.

### Le local ne reflète pas la production

`enable_confirmations = false` implique `GOTRUE_MAILER_AUTOCONFIRM=true`, qui
**court-circuite la seconde confirmation en local**. Vérifié : en local le
changement est finalisé dès le premier lien, et le second répond alors
`Email link is invalid or has expired`. En production les deux sont exigés.

Ne pas conclure du comportement local que le second mail est inutile.

### Traductions

Les anciennes clés `change_*` visaient déjà la nouvelle adresse, renommées
`change_new_*`. Nouveau jeu `change_current_*` rédigé dans les 9 langues, dont
le body porte `{newEmail}` pour que le propriétaire de l'ancienne boîte voie
**où** part son compte avant d'autoriser.

Vérifié : 9 locales x 25 clés se résolvent, placeholder interpolé partout.