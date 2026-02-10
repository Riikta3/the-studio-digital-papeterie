"use server";

import { MagicLinkEmail } from "@/emails/MagicLinkEmail";
import { sendEmail } from "@/lib/email";
import { ActionResult } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { createMagicLinkForHousehold } from "@/utils/tokens";
import { render } from "@react-email/components";

export async function sendMagicLinkToHousehold(
  householdId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Get Household Data
  const { data: household, error: fetchError } = await supabase
    .from("households")
    .select("*")
    .eq("id", householdId)
    .single();

  if (fetchError || !household) {
    return { success: false, error: "Foyer introuvable." };
  }

  if (!household.email) {
    return { success: false, error: "Ce foyer n'a pas d'adresse email." };
  }

  // 2. Generate/Rotate Token
  // Note: createMagicLinkForHousehold creates a new token in DB
  // access to tokens.ts might need fix if I didn't export it right or path is wrong
  // But assuming it works:
  // We need to implement createMagicLinkForHousehold in utils/tokens.ts first properly
  // I did create it.

  // Wait, I need to call the function to update the DB.
  // The function `createMagicLinkForHousehold` in `src/utils/tokens.ts` updates DB and returns token?
  // Let's check `src/utils/tokens.ts` content I wrote.
  // Yes: returns token.

  // Actually, I need to make sure I import it correctly.

  try {
    // Generate Token
    // We need to implement this function in src/utils/tokens.ts if not already perfect
    // I wrote it to update DB.

    // But wait, the standard usually is to pull the logic here or import it.
    // I'll assume it's imported from @/utils/tokens

    // UPDATE: The previous step I wrote `src/utils/tokens.ts` but I might have imported `createClient` relatively.
    // Let's assume standard import `@/utils/tokens`.

    // TODO: Implement the token rotation
    // For now, let's just generate a simple one here if the util isn't perfectly linked,
    // but better to use the util.

    // Re-reading `src/utils/tokens.ts`:
    /*
     export async function createMagicLinkForHousehold(householdId: string) {
        ... updates DB ...
        return token;
     }
     */

    // So I can just call it.

    // However, `createMagicLinkForHousehold` uses `createClient` internally.

    // Let's optimize:
    const token = await createMagicLinkForHousehold(householdId);

    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

    // 3. Render Email
    const emailHtml = await render(
      MagicLinkEmail({
        householdName: household.name,
        magicLink: magicLinkUrl,
      }),
    );

    // 4. Send Email
    const result = await sendEmail({
      to: household.email,
      subject: "Votre accès à l'espace invités",
      html: emailHtml,
      householdId: household.id,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors de l'envoi.",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending magic link:", error);
    return { success: false, error: error.message };
  }
}
