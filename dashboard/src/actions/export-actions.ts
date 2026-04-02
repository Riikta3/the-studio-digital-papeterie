"use server";

import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";

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
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "The Studio Papeterie Digital";
    workbook.lastModifiedBy = "The Studio Papeterie Digital";
    workbook.created = new Date();
    workbook.modified = new Date();

    // === SHEET 1: Récapitulatif ===
    const summarySheet = workbook.addWorksheet(t.sheets.summary);

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

    summarySheet.addRows(recapData);

    // Style the first column to be bold
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(1).font = { bold: true };
    summarySheet.getColumn(2).width = 15;

    // === SHEET 2: Foyers ===
    const householdsSheet = workbook.addWorksheet(t.sheets.households);

    householdsSheet.columns = [
      { header: t.headers.household_name, key: "name", width: 25 },
      { header: t.headers.email, key: "email", width: 25 },
      { header: t.headers.phone, key: "phone", width: 15 },
      { header: t.headers.guest_count, key: "guest_count", width: 15 },
      { header: t.headers.status, key: "status", width: 15 },
      { header: t.headers.creation_date, key: "created_at", width: 20 },
    ];

    const householdsRows = households.map((h) => ({
      name: h.name,
      email: h.email || "",
      phone: h.phone || "",
      guest_count: (h.guests || []).length,
      status: t.status[h.status] || h.status,
      created_at: new Date(h.created_at).toLocaleDateString(
        targetLocale === "en" ? "en-US" : "fr-FR",
      ),
    }));

    householdsSheet.addRows(householdsRows);
    householdsSheet.getRow(1).font = { bold: true };

    // === SHEET 3: Invités ===
    const guestsSheet = workbook.addWorksheet(t.sheets.guests);

    guestsSheet.columns = [
      { header: t.headers.household, key: "household_name", width: 25 },
      { header: t.headers.firstname, key: "first_name", width: 20 },
      { header: t.headers.lastname, key: "last_name", width: 20 },
      { header: t.headers.email, key: "email", width: 25 },
      { header: t.headers.relation, key: "relation_type", width: 15 },
      { header: t.headers.status, key: "status", width: 15 },
      { header: t.headers.child, key: "is_child", width: 10 },
      { header: t.headers.plus_one, key: "is_plus_one", width: 10 },
      { header: t.headers.diet, key: "dietary_requirements", width: 20 },
      { header: t.headers.diet_details, key: "dietary_details", width: 25 },
    ];

    const guestsRows = households.flatMap((h) =>
      (h.guests || []).map((g) => ({
        household_name: h.name,
        first_name: g.first_name,
        last_name: g.last_name,
        email: g.email || "",
        relation_type: t.relations[g.relation_type] || g.relation_type || "",
        status: t.status[g.status] || g.status,
        is_child: g.is_child ? t.boolean.yes : t.boolean.no,
        is_plus_one: g.is_plus_one ? t.boolean.yes : t.boolean.no,
        dietary_requirements:
          t.diet[g.dietary_requirements] || g.dietary_requirements || "",
        dietary_details: g.dietary_details || "",
      })),
    );

    guestsSheet.addRows(guestsRows);
    guestsSheet.getRow(1).font = { bold: true };

    // Generate Excel file as buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as Base64 string to avoid serialization issues with Buffer across Server Actions
    return { success: true, data: Buffer.from(buffer).toString("base64") };
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

export async function downloadImportTemplate(
  locale: string = "fr",
): Promise<
  { success: true; data: string } | { success: false; error: string }
> {
  const supportedLocales = ["fr", "en"];
  const targetLocale = supportedLocales.includes(locale) ? locale : "fr";
  const t = EXPORT_TRANSLATIONS[targetLocale];

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "The Studio Papeterie Digital";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(t.sheets.guests || "Invités");

    worksheet.columns = [
      { header: t.headers.household_name, key: "household_name", width: 20 },
      { header: t.headers.email, key: "email", width: 25 },
      { header: t.headers.phone, key: "phone", width: 15 },
      { header: t.headers.firstname, key: "first_name", width: 15 },
      { header: t.headers.lastname, key: "last_name", width: 15 },
      { header: t.headers.relation, key: "relation_type", width: 15 },
      { header: t.headers.status, key: "status", width: 15 },
      { header: t.headers.child, key: "is_child", width: 10 },
      { header: t.headers.plus_one, key: "is_plus_one", width: 10 },
      { header: t.headers.diet, key: "dietary_requirements", width: 15 },
      { header: t.headers.diet_details, key: "dietary_details", width: 25 },
    ];

    // Example row
    worksheet.addRow({
      household_name:
        t.headers.household_name === "Nom du foyer"
          ? "Famille Martin"
          : "Martin Family",
      email: "email@example.com",
      phone: "0600000000",
      first_name: t.headers.firstname === "Prénom" ? "Jean" : "John",
      last_name: t.headers.lastname === "Nom" ? "Martin" : "Doe",
      relation_type: "",
      status: "",
      is_child: t.boolean.no,
      is_plus_one: t.boolean.no,
      dietary_requirements: "",
      dietary_details: "",
    });

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.height = 30;

    worksheet.getRow(2).height = 20;

    // === SHEET 2: Instructions (Lexicon) ===
    const instructionSheet = workbook.addWorksheet("Instructions");
    instructionSheet.columns = [
      { header: "Champ", key: "field", width: 30 },
      {
        header: "Valeurs acceptées / Description",
        key: "description",
        width: 100,
      },
    ];

    const instructionData = [
      {
        field: t.headers.relation,
        description: Object.values(t.relations).join(", "),
      },
      {
        field: t.headers.status,
        description: Object.values(t.status).join(", "),
      },
      { field: t.headers.diet, description: Object.values(t.diet).join(", ") },
      {
        field: t.headers.child + " / " + t.headers.plus_one,
        description: `${t.boolean.yes}, ${t.boolean.no}`,
      },
      {
        field: t.headers.email,
        description: "Format email valide (ex: contact@mail.com)",
      },
      { field: t.headers.phone, description: "Numéro de téléphone" },
    ];

    instructionSheet.addRows(instructionData);
    instructionSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    return { success: true, data: Buffer.from(buffer).toString("base64") };
  } catch (error) {
    console.error("Error generating template:", error);
    return { success: false, error: "Erreur lors de la génération du modèle." };
  }
}
