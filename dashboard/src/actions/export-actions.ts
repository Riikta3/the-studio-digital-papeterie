"use server";

import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function exportGuestsToExcel(): Promise<
  { success: true; data: Buffer } | { success: false; error: string }
> {
  try {
    const supabase = await createClient();

    // Get wedding ID from user session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("wedding_id")
      .eq("id", user.id)
      .single();

    if (!profile?.wedding_id) {
      return { success: false, error: "Pas de mariage associé" };
    }

    // Fetch all households with their guests
    const { data: households, error: householdsError } = await supabase
      .from("households")
      .select(
        `
        id,
        name,
        email,
        phone,
        status,
        created_at,
        guests (
          id,
          first_name,
          last_name,
          email,
          relation_type,
          status,
          is_child,
          is_plus_one,
          dietary_requirements,
          dietary_details
        )
      `,
      )
      .eq("wedding_id", profile.wedding_id)
      .order("name");

    if (householdsError) {
      console.error("Supabase error:", householdsError);
      return {
        success: false,
        error: `Erreur DB: ${householdsError.message}`,
      };
    }

    if (!households) {
      return {
        success: false,
        error: "Aucune donnée trouvée",
      };
    }

    // Prepare data structures
    const workbook = XLSX.utils.book_new();

    // === SHEET 1: Récapitulatif ===
    const allGuests = households.flatMap((h) => h.guests || []);
    const totalHouseholds = households.length;
    const totalGuests = allGuests.length;
    const confirmedGuests = allGuests.filter(
      (g) => g.status === "confirmed",
    ).length;
    const pendingGuests = allGuests.filter(
      (g) => g.status === "pending",
    ).length;
    const declinedGuests = allGuests.filter(
      (g) => g.status === "declined",
    ).length;
    const children = allGuests.filter((g) => g.is_child).length;

    const dietaryCount: Record<string, number> = {};
    allGuests.forEach((g) => {
      if (g.dietary_requirements) {
        dietaryCount[g.dietary_requirements] =
          (dietaryCount[g.dietary_requirements] || 0) + 1;
      }
    });

    const recapData = [
      ["📊 Récapitulatif des invités", ""],
      ["", ""],
      ["Statistiques générales", ""],
      ["Nombre de foyers", totalHouseholds],
      ["Nombre total d'invités", totalGuests],
      ["", ""],
      ["Répartition par statut", ""],
      ["Confirmés", confirmedGuests],
      ["En attente", pendingGuests],
      ["Déclinés", declinedGuests],
      ["", ""],
      ["Informations complémentaires", ""],
      ["Enfants", children],
      ["Adultes", totalGuests - children],
      ["", ""],
      ["Restrictions alimentaires", "Nombre"],
      ...Object.entries(dietaryCount).map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1).replace("_", " "),
        value,
      ]),
    ];

    const recapSheet = XLSX.utils.aoa_to_sheet(recapData);
    XLSX.utils.book_append_sheet(workbook, recapSheet, "Récap");

    // === SHEET 2: Foyers ===
    const householdsData = [
      [
        "Nom du foyer",
        "Email",
        "Téléphone",
        "Nombre d'invités",
        "Statut",
        "Date de création",
      ],
      ...households.map((h) => [
        h.name,
        h.email || "",
        h.phone || "",
        (h.guests || []).length,
        h.status === "confirmed"
          ? "Confirmé"
          : h.status === "declined"
            ? "Décliné"
            : h.status === "partial"
              ? "Partiel"
              : "En attente",
        new Date(h.created_at).toLocaleDateString("fr-FR"),
      ]),
    ];

    const householdsSheet = XLSX.utils.aoa_to_sheet(householdsData);
    XLSX.utils.book_append_sheet(workbook, householdsSheet, "Foyers");

    // === SHEET 3: Invités ===
    const guestsData = [
      [
        "Foyer",
        "Prénom",
        "Nom",
        "Email",
        "Type de relation",
        "Statut",
        "Enfant",
        "Accompagnant",
        "Régime alimentaire",
        "Détails régime",
      ],
      ...households.flatMap((h) =>
        (h.guests || []).map((g) => [
          h.name,
          g.first_name,
          g.last_name,
          g.email || "",
          g.relation_type || "",
          g.status === "confirmed"
            ? "Confirmé"
            : g.status === "declined"
              ? "Décliné"
              : "En attente",
          g.is_child ? "Oui" : "Non",
          g.is_plus_one ? "Oui" : "Non",
          g.dietary_requirements || "",
          g.dietary_details || "",
        ]),
      ),
    ];

    const guestsSheet = XLSX.utils.aoa_to_sheet(guestsData);
    XLSX.utils.book_append_sheet(workbook, guestsSheet, "Invités");

    // Generate Excel file as buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return { success: true, data: Buffer.from(excelBuffer) };
  } catch (error) {
    console.error("Export Excel error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      error: `Erreur: ${errorMessage}`,
    };
  }
}
