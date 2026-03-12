/**
 * Translates Supabase/Auth error messages to French.
 * Supabase returns errors in English — this maps known messages to French.
 */
export function translateSupabaseError(message: string): string {
  const m = message.toLowerCase();

  // Auth — email
  if (m.includes("user already registered") || m.includes("email address is already registered") || m.includes("already exists"))
    return "Cette adresse email est déjà utilisée.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "L'adresse email n'est pas valide.";
  if (m.includes("email not confirmed"))
    return "Veuillez confirmer votre adresse email avant de continuer.";
  if (m.includes("email change") && m.includes("same"))
    return "La nouvelle adresse email est identique à l'actuelle.";

  // Auth — password
  if (m.includes("password should be at least") || m.includes("weak password") || m.includes("password is too short"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("same password") || m.includes("new password should be different"))
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (m.includes("invalid login credentials") || m.includes("invalid password"))
    return "Identifiants incorrects.";

  // Auth — session / token
  if (m.includes("jwt expired") || m.includes("token is expired") || m.includes("session expired"))
    return "Votre session a expiré. Veuillez vous reconnecter.";
  if (m.includes("invalid token") || m.includes("token not found"))
    return "Lien invalide ou expiré.";
  if (m.includes("not authenticated") || m.includes("unauthorized"))
    return "Vous devez être connecté pour effectuer cette action.";

  // Auth — rate limit
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Trop de tentatives. Veuillez patienter avant de réessayer.";

  // Auth — user not found
  if (m.includes("user not found"))
    return "Aucun compte trouvé avec ces informations.";

  // DB — generic
  if (m.includes("violates unique constraint") || m.includes("duplicate key"))
    return "Cette valeur existe déjà.";
  if (m.includes("violates foreign key constraint"))
    return "Opération impossible : des données liées existent encore.";
  if (m.includes("violates not-null constraint"))
    return "Un champ obligatoire est manquant.";

  // Network
  if (m.includes("fetch failed") || m.includes("network"))
    return "Erreur de connexion. Vérifiez votre connexion internet.";

  // Fallback — message générique sans exposer le message Supabase brut
  return "Une erreur est survenue. Veuillez réessayer.";
}
