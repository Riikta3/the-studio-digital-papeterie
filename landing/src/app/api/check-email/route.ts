import { NextResponse } from "next/server";

import { findUserByEmail } from "@/lib/find-user-by-email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let isEmailTaken = false;
    try {
      isEmailTaken = !!(await findUserByEmail(email));
    } catch (searchError) {
      console.error("[CHECK_EMAIL_AUTH_LOOKUP]", searchError);
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 500 },
      );
    }

    if (isEmailTaken) {
      return NextResponse.json(
        {
          error:
            "Cet email est déjà lié à un compte existant ! Veuillez vous connecter ou utiliser une autre adresse.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CHECK_EMAIL_ERROR]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
