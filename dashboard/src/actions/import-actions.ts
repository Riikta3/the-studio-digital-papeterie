"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

// Mapping for headers and values (Reverse of Export)
const IMPORT_MAPPINGS: {
  headers: { [key: string]: string };
  relations: { [key: string]: string };
  diets: { [key: string]: string };
  boolean: { [key: string]: boolean };
  status: { [key: string]: string };
} = {
  headers: {
    // English
    "Household Name": "name",
    Email: "email",
    Phone: "phone",
    Household: "name", // In Guests sheet
    "First Name": "first_name",
    "Last Name": "last_name",
    "Relation Type": "relation_type",
    Status: "status",
    Child: "is_child",
    "Plus One": "is_plus_one",
    "Dietary Requirements": "dietary_requirements",
    Details: "dietary_details",
    // French
    "Nom du foyer": "name",
    Foyer: "name",
    Prénom: "first_name",
    Nom: "last_name",
    "Type de relation": "relation_type",
    Statut: "status",
    Enfant: "is_child",
    Accompagnant: "is_plus_one",
    "Régime alimentaire": "dietary_requirements",
    "Détails régime": "dietary_details",
  },
  relations: {
    // Fr
    "Conjoint(e)": "spouse",
    Partenaire: "partner",
    Enfant: "child",
    Famille: "family",
    "Ami(e)": "friend",
    Collègue: "colleague",
    Autre: "other",
    // En
    Spouse: "spouse",
    Partner: "partner",
    Child: "child",
    Family: "family",
    Friend: "friend",
    Colleague: "colleague",
    Other: "other",
  },
  diets: {
    // Fr
    Aucun: "none",
    Végétarien: "vegetarian",
    Végan: "vegan",
    "Sans gluten": "gluten_free",
    Halal: "halal",
    Casher: "kosher",
    Allergie: "allergy",
    // En
    None: "none",
    Vegetarian: "vegetarian",
    Vegan: "vegan",
    "Gluten free": "gluten_free",
    Kosher: "kosher",
    Allergy: "allergy",
  },
  boolean: {
    Oui: true,
    Yes: true,
    Non: false,
    No: false,
  },
  status: {
    // Fr
    Confirmé: "confirmed",
    Décliné: "declined",
    "En attente": "pending",
    Partiel: "partial",
    // En
    Confirmed: "confirmed",
    Declined: "declined",
    Pending: "pending",
    Partial: "partial",
  },
};

export async function importGuestsFromExcel(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Aucun fichier fourni" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non authentifié" };

    const weddingId = user.id;

    // Read and parse file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // Try to find specific sheets
    let worksheet = workbook.Sheets["Invités"];
    if (!worksheet) {
      // Fallback to "Guests" or first sheet
      worksheet =
        workbook.Sheets["Guests"] || workbook.Sheets[workbook.SheetNames[0]];
    }

    if (!worksheet) {
      return {
        success: false,
        error: "Feuille 'Invités' ou 'Guests' introuvable",
      };
    }

    // Convert to JSON with raw headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    }) as any[];

    if (rawData.length === 0) {
      return { success: false, error: "Le fichier est vide" };
    }

    // Process data
    let householdCount = 0;
    let guestCount = 0;

    // Group by Household Name to act efficiently
    const householdsMap = new Map<string, any[]>();

    rawData.forEach((row) => {
      // Detect household name key (localized)
      const householdName =
        row["Nom du foyer"] ||
        row["Household Name"] ||
        row["Household"] ||
        row["Foyer"];

      if (householdName) {
        if (!householdsMap.has(householdName)) {
          householdsMap.set(householdName, []);
        }
        householdsMap.get(householdName)?.push(row);
      }
    });

    for (const [name, rows] of householdsMap.entries()) {
      // 1. Create Household
      // We assume creation for import to avoid overwrite risks, user can merge later
      const { data: household, error: hhError } = await supabase
        .from("households")
        .insert({
          wedding_id: weddingId,
          name: name,
          email: rows[0]["Email"] || null, // Take first available email
          phone: rows[0]["Phone"] || rows[0]["Téléphone"] || null,
          status: "pending", // Default for import
          source: "admin",
        })
        .select()
        .single();

      if (hhError) {
        console.error(`Error importing household ${name}:`, hhError);
        continue; // Skip this household on error
      }

      householdCount++;

      // 2. Create Guests
      const guestsToInsert = rows.map((row) => {
        // Map fields using helpers
        const rawRelation =
          row["Type de relation"] || row["Relation Type"] || "";
        const rawDiet =
          row["Régime alimentaire"] || row["Dietary Requirements"] || "";
        const rawStatus = row["Statut"] || row["Status"] || "Pending";
        const rawChild = row["Enfant"] || row["Child"];
        const rawPlusOne = row["Accompagnant"] || row["Plus One"];

        return {
          wedding_id: weddingId,
          household_id: household.id,
          first_name: row["Prénom"] || row["First Name"] || "Invité",
          last_name: row["Nom"] || row["Last Name"] || ".",
          email: row["Email"] || null,
          relation_type: IMPORT_MAPPINGS.relations[rawRelation] || null,
          dietary_requirements: IMPORT_MAPPINGS.diets[rawDiet] || null,
          dietary_details: row["Détails régime"] || row["Details"] || null,
          status: IMPORT_MAPPINGS.status[rawStatus] || "pending",
          is_child: IMPORT_MAPPINGS.boolean[rawChild] || false,
          is_plus_one: IMPORT_MAPPINGS.boolean[rawPlusOne] || false,
        };
      });

      if (guestsToInsert.length > 0) {
        const { error: gError } = await supabase
          .from("guests")
          .insert(guestsToInsert);

        if (!gError) {
          guestCount += guestsToInsert.length;
        } else {
          console.error(`Error importing guests for ${name}:`, gError);
        }
      }
    }

    revalidatePath("/guests");
    return {
      success: true,
      message: `${householdCount} foyers et ${guestCount} invités importés avec succès.`,
    };
  } catch (error) {
    console.error("Import error:", error);
    return { success: false, error: "Erreur technique lors de l'import." };
  }
}
