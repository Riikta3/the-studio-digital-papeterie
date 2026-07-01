import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: searchData, error: searchError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (searchError) {
      console.error("[PREFLIGHT_AUTH_CHECK]", searchError);
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 500 },
      );
    }

    const isEmailTaken = searchData?.users.some((u) => u.email === email);

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
  } catch (err: any) {
    console.error("[CHECK_EMAIL_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
