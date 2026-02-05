"use server";

import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

const EXPORT_TRANSLATIONS: Record<string, any> = {
  fr: {
    relations: {
      spouse: "Conjoint(e)",
      partner: "Partenaire",
      child: "Enfant",
      family: "Famille",
      friend: "Ami(e)",
      colleague: "Collègue",
      other: "Autre",
    },
    diet: {
      none: "Aucun",
      vegetarian: "Végétarien",
      vegan: "Végan",
      gluten_free: "Sans gluten",
      halal: "Halal",
      kosher: "Casher",
      allergy: "Allergie",
      other: "Autre",
    },
    status: {
      confirmed: "Confirmé",
      declined: "Décliné",
      pending: "En attente",
      partial: "Partiel",
    },
    headers: {
      household_name: "Nom du foyer",
      email: "Email",
      phone: "Téléphone",
      guest_count: "Nombre d'invités",
      creation_date: "Date de création",
      status: "Statut",
      household: "Foyer",
      firstname: "Prénom",
      lastname: "Nom",
      relation: "Type de relation",
      child: "Enfant",
      plus_one: "Accompagnant",
      diet: "Régime alimentaire",
      diet_details: "Détails régime",
    },
    sheets: {
      summary: "Récap",
      households: "Foyers",
      guests: "Invités",
    },
    boolean: {
      yes: "Oui",
      no: "Non",
    },
  },
  en: {
    relations: {
      spouse: "Spouse",
      partner: "Partner",
      child: "Child",
      family: "Family",
      friend: "Friend",
      colleague: "Colleague",
      other: "Other",
    },
    diet: {
      none: "None",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      gluten_free: "Gluten free",
      halal: "Halal",
      kosher: "Kosher",
      allergy: "Allergy",
      other: "Other",
    },
    status: {
      confirmed: "Confirmed",
      declined: "Declined",
      pending: "Pending",
      partial: "Partial",
    },
    headers: {
      household_name: "Household Name",
      email: "Email",
      phone: "Phone",
      guest_count: "Guest Count",
      creation_date: "Creation Date",
      status: "Status",
      household: "Household",
      firstname: "First Name",
      lastname: "Last Name",
      relation: "Relation Type",
      child: "Child",
      plus_one: "Plus One",
      diet: "Dietary Requirements",
      diet_details: "Details",
    },
    sheets: {
      summary: "Summary",
      households: "Households",
      guests: "Guests",
    },
    boolean: {
      yes: "Yes",
      no: "No",
    },
  },
  // Default fallbacks for other languages to English or French as preference
  de: null, // will use fallback
  es: null, // will use fallback
  it: null,
  pt: null,
  ar: null,
  zh: null,
  ja: null,
};

export async function exportGuestsToExcel(
  locale: string = "fr", // Default to French
): Promise<
  { success: true; data: string } | { success: false; error: string }
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

    // Use user.id as wedding_id directly (1 user = 1 wedding pattern)
    // This avoids issues if the profile record is missing or incomplete
    const weddingId = user.id;

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
      .eq("wedding_id", weddingId)
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

    // Select translation based on locale, fallback to 'en' or 'fr'
    // If exact locale not found, use 'fr' as mostly requested base, or 'en'
    const supportedLocales = ["fr", "en"];
    const targetLocale = supportedLocales.includes(locale) ? locale : "fr";
    const t = EXPORT_TRANSLATIONS[targetLocale];

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
        // Translate key for summary if possible, or keep raw
        const dietKey = g.dietary_requirements;
        const translatedDiet = t.diet[dietKey] || dietKey;
        dietaryCount[translatedDiet] = (dietaryCount[translatedDiet] || 0) + 1;
      }
    });

    const recapData = [
      [`📊 ${t.sheets.summary}`, ""],
      ["", ""],
      ["Statistiques", ""],
      ["Foyers", totalHouseholds],
      ["Total Invités", totalGuests],
      ["", ""],
      ["Status", ""],
      [t.status.confirmed, confirmedGuests],
      [t.status.pending, pendingGuests],
      [t.status.declined, declinedGuests],
      ["", ""],
      ["Détails", ""],
      [t.headers.child, children],
      ["Adultes", totalGuests - children],
      ["", ""],
      [t.headers.diet, "Nombre"],
      ...Object.entries(dietaryCount).map(([key, value]) => [key, value]),
    ];

    const recapSheet = XLSX.utils.aoa_to_sheet(recapData);
    XLSX.utils.book_append_sheet(workbook, recapSheet, t.sheets.summary);

    // === SHEET 2: Foyers ===
    const householdsData = [
      [
        t.headers.household_name,
        t.headers.email,
        t.headers.phone,
        t.headers.guest_count,
        t.headers.status,
        t.headers.creation_date,
      ],
      ...households.map((h) => [
        h.name,
        h.email || "",
        h.phone || "",
        (h.guests || []).length,
        t.status[h.status] || h.status,
        new Date(h.created_at).toLocaleDateString(
          targetLocale === "en" ? "en-US" : "fr-FR",
        ),
      ]),
    ];

    const householdsSheet = XLSX.utils.aoa_to_sheet(householdsData);
    XLSX.utils.book_append_sheet(
      workbook,
      householdsSheet,
      t.sheets.households,
    );

    // === SHEET 3: Invités ===
    const guestsData = [
      [
        t.headers.household,
        t.headers.firstname,
        t.headers.lastname,
        t.headers.email,
        t.headers.relation,
        t.headers.status,
        t.headers.child,
        t.headers.plus_one,
        t.headers.diet,
        t.headers.diet_details,
      ],
      ...households.flatMap((h) =>
        (h.guests || []).map((g) => [
          h.name,
          g.first_name,
          g.last_name,
          g.email || "",
          t.relations[g.relation_type] || g.relation_type || "",
          t.status[g.status] || g.status,
          g.is_child ? t.boolean.yes : t.boolean.no,
          g.is_plus_one ? t.boolean.yes : t.boolean.no,
          t.diet[g.dietary_requirements] || g.dietary_requirements || "",
          g.dietary_details || "",
        ]),
      ),
    ];

    const guestsSheet = XLSX.utils.aoa_to_sheet(guestsData);
    XLSX.utils.book_append_sheet(workbook, guestsSheet, t.sheets.guests);

    // Generate Excel file as buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Return as Base64 string to avoid serialization issues with Buffer across Server Actions
    return { success: true, data: excelBuffer.toString("base64") };
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
