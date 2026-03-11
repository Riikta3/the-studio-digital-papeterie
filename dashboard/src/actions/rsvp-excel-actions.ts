"use server";

import { createClient } from "@/utils/supabase/server";
import { DIETARY_OPTIONS_EN, DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";

// ─── Translations ──────────────────────────────────────────────────────────────

const T = {
  fr: {
    attendance: { confirmed: "Confirmé", declined: "Absent", pending: "En attente" },
    relations: {
      partner: "Conjoint(e)", spouse: "Époux/Épouse", child: "Enfant",
      parent: "Parent", sibling: "Frère/Sœur", grandparent: "Grand-parent",
      grandchild: "Petit-enfant", family: "Famille élargie",
      friend: "Ami(e)", colleague: "Collègue", plus_one: "Accompagnant(e)", other: "Autre",
    },
    headers: {
      first_name: "Prénom", last_name: "Nom", attendance: "Présence",
      dietary: "Régime / Allergies", message: "Message", admin_note: "Note interne",
      submitted_at: "Date de réponse",
      companion_first: (n: number) => `Accompagnant ${n} Prénom`,
      companion_last: (n: number) => `Accompagnant ${n} Nom`,
      companion_relation: (n: number) => `Accompagnant ${n} Lien`,
    },
    sheets: { responses: "Réponses RSVP", summary: "Récap" },
  },
  en: {
    attendance: { confirmed: "Confirmed", declined: "Absent", pending: "Pending" },
    relations: {
      partner: "Partner", spouse: "Spouse", child: "Child",
      parent: "Parent", sibling: "Sibling", grandparent: "Grandparent",
      grandchild: "Grandchild", family: "Extended family",
      friend: "Friend", colleague: "Colleague", plus_one: "Plus one", other: "Other",
    },
    headers: {
      first_name: "First Name", last_name: "Last Name", attendance: "Attendance",
      dietary: "Dietary / Allergies", message: "Message", admin_note: "Internal Note",
      submitted_at: "Response Date",
      companion_first: (n: number) => `Companion ${n} First Name`,
      companion_last: (n: number) => `Companion ${n} Last Name`,
      companion_relation: (n: number) => `Companion ${n} Relation`,
    },
    sheets: { responses: "RSVP Responses", summary: "Summary" },
  },
};

const IMPORT_ATTENDANCE: Record<string, boolean | null> = {
  Confirmé: true, Confirmed: true,
  Absent: false,
  "En attente": null, Pending: null,
};

const IMPORT_RELATIONS: Record<string, string> = {
  "Conjoint(e)": "partner", Partner: "partner",
  "Époux/Épouse": "spouse", Spouse: "spouse",
  Enfant: "child", Child: "child",
  Parent: "parent",
  "Frère/Sœur": "sibling", Sibling: "sibling",
  "Grand-parent": "grandparent", Grandparent: "grandparent",
  "Petit-enfant": "grandchild", Grandchild: "grandchild",
  "Famille élargie": "family", "Extended family": "family",
  "Ami(e)": "friend", Friend: "friend",
  Collègue: "colleague", Colleague: "colleague",
  "Accompagnant(e)": "plus_one", "Plus one": "plus_one",
  Autre: "other", Other: "other",
};

// ─── Helper ────────────────────────────────────────────────────────────────────

function sheetToJson(worksheet: ExcelJS.Worksheet): any[] {
  const jsonData: any[] = [];
  let headers: string[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      headers = (row.values as string[]);
      if (Array.isArray(headers) && headers[0] === undefined) headers = headers.slice(1);
    } else {
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        const cellValue = row.getCell(index + 1).value;
        let finalValue = cellValue;
        if (typeof cellValue === "object" && cellValue !== null) {
          if ("text" in cellValue) finalValue = (cellValue as any).text;
          else if ("result" in cellValue) finalValue = (cellValue as any).result;
        }
        rowData[header] = finalValue;
      });
      jsonData.push(rowData);
    }
  });
  return jsonData;
}

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FF1F2937" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
    cell.alignment = { vertical: "middle" };
  });
}

// ─── Export ────────────────────────────────────────────────────────────────────

export async function exportRsvpToExcel(
  locale: string = "fr",
): Promise<{ success: true; data: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const { data: wedding } = await supabase.from("weddings").select("id").eq("user_id", user.id).single();
    if (!wedding) return { success: false, error: "Mariage introuvable" };

    const { data: responses, error } = await supabase
      .from("rsvp_responses")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("submitted_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    if (!responses) return { success: false, error: "Aucune donnée" };

    const t = locale === "en" ? T.en : T.fr;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "The Studio Digital Papeterie";
    workbook.created = new Date();

    // Max companions across all responses
    const maxCompanions = responses.reduce((max, r) => {
      const count = Array.isArray(r.participants) ? r.participants.length : 0;
      return Math.max(max, count);
    }, 0);

    // === SHEET 1: Récap ===
    const summarySheet = workbook.addWorksheet(t.sheets.summary);
    const total = responses.length;
    const confirmed = responses.filter((r) => r.attendance === true).length;
    const declined = responses.filter((r) => r.attendance === false).length;
    const pending = responses.filter((r) => r.attendance === null).length;
    const totalPersons = responses
      .filter((r) => r.attendance === true)
      .reduce((acc, r) => {
        const parts = Array.isArray(r.participants) ? r.participants.length : 0;
        return acc + 1 + (parts > 0 ? parts : r.guest_count ?? 0);
      }, 0);

    summarySheet.addRows([
      ["📊 " + t.sheets.summary, ""],
      ["", ""],
      ["Total réponses", total],
      [t.attendance.confirmed, confirmed],
      [t.attendance.declined, declined],
      [t.attendance.pending, pending],
      ["", ""],
      ["Personnes attendues", totalPersons],
    ]);
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(1).font = { bold: true };
    summarySheet.getColumn(2).width = 15;

    // === SHEET 2: Réponses + accompagnants inline ===
    const responsesSheet = workbook.addWorksheet(t.sheets.responses);

    // Build columns: base columns + companion columns dynamically
    const baseColumns: ExcelJS.Column[] = [
      { header: t.headers.first_name, key: "first_name", width: 18 } as ExcelJS.Column,
      { header: t.headers.last_name, key: "last_name", width: 18 } as ExcelJS.Column,
      { header: t.headers.attendance, key: "attendance", width: 14 } as ExcelJS.Column,
      { header: t.headers.dietary, key: "dietary", width: 25 } as ExcelJS.Column,
      { header: t.headers.message, key: "message", width: 35 } as ExcelJS.Column,
      { header: t.headers.admin_note, key: "admin_note", width: 35 } as ExcelJS.Column,
      { header: t.headers.submitted_at, key: "submitted_at", width: 20 } as ExcelJS.Column,
    ];

    const companionColumns: ExcelJS.Column[] = [];
    for (let i = 1; i <= maxCompanions; i++) {
      companionColumns.push(
        { header: t.headers.companion_first(i), key: `comp_${i}_first`, width: 20 } as ExcelJS.Column,
        { header: t.headers.companion_last(i), key: `comp_${i}_last`, width: 20 } as ExcelJS.Column,
        { header: t.headers.companion_relation(i), key: `comp_${i}_relation`, width: 20 } as ExcelJS.Column,
      );
    }

    responsesSheet.columns = [...baseColumns, ...companionColumns];

    for (const r of responses) {
      const attendanceLabel =
        r.attendance === true ? t.attendance.confirmed :
        r.attendance === false ? t.attendance.declined :
        t.attendance.pending;

      const row: Record<string, any> = {
        first_name: r.respondent_first_name || r.name.split(" ")[0] || "",
        last_name: r.respondent_last_name || r.name.split(" ").slice(1).join(" ") || "",
        attendance: attendanceLabel,
        dietary: r.dietary || "",
        message: r.message || "",
        admin_note: r.admin_note || "",
        submitted_at: new Date(r.submitted_at).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR"),
      };

      if (Array.isArray(r.participants)) {
        r.participants.forEach((p: any, i: number) => {
          const n = i + 1;
          row[`comp_${n}_first`] = p.first_name || "";
          row[`comp_${n}_last`] = p.last_name || "";
          row[`comp_${n}_relation`] = t.relations[(p.relation_type as keyof typeof t.relations)] || p.relation_type || "";
        });
      }

      responsesSheet.addRow(row);
    }

    styleHeaderRow(responsesSheet);

    // Light color for companion header cells
    for (let i = 1; i <= maxCompanions; i++) {
      const colOffset = baseColumns.length + (i - 1) * 3;
      for (let c = 1; c <= 3; c++) {
        const cell = responsesSheet.getRow(1).getCell(colOffset + c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return { success: true, data: Buffer.from(buffer).toString("base64") };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return { success: false, error: msg };
  }
}

// ─── Template ──────────────────────────────────────────────────────────────────

const DIETARY_OPTIONS = {
  fr: DIETARY_OPTIONS_FR as unknown as string[],
  en: DIETARY_OPTIONS_EN as unknown as string[],
};

// Returns the Excel column letter(s) for a 1-based index (1=A, 26=Z, 27=AA...)
function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

// Add dropdown validation to a column for data rows (row 2 to maxRows)
function addDropdown(
  sheet: ExcelJS.Worksheet,
  colIndex: number,
  formulae: string,
  maxRows = 200,
  showErrorMessage = true,
) {
  for (let row = 2; row <= maxRows; row++) {
    sheet.getCell(row, colIndex).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [formulae],
      showErrorMessage,
      errorStyle: "warning",
      errorTitle: "Valeur non reconnue",
      error: "Veuillez choisir une valeur dans la liste déroulante.",
    };
  }
}

export async function downloadRsvpTemplate(
  locale: string = "fr",
): Promise<{ success: true; data: string } | { success: false; error: string }> {
  try {
    const t = locale === "en" ? T.en : T.fr;
    const dietaryOptions = locale === "en" ? DIETARY_OPTIONS.en : DIETARY_OPTIONS.fr;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "The Studio Digital Papeterie";
    workbook.created = new Date();

    // === Hidden sheet "_Listes" with dropdown source data ===
    const listsSheet = workbook.addWorksheet("_Listes");
    listsSheet.state = "veryHidden";

    const attendanceValues = Object.values(t.attendance);
    const relationValues = Object.values(t.relations);

    // Col A: Attendance values
    attendanceValues.forEach((v, i) => { listsSheet.getCell(i + 1, 1).value = v; });
    // Col B: Relation values
    relationValues.forEach((v, i) => { listsSheet.getCell(i + 1, 2).value = v; });
    // Col C: Dietary values
    dietaryOptions.forEach((v, i) => { listsSheet.getCell(i + 1, 3).value = v; });

    const attendanceRange = `_Listes!$A$1:$A$${attendanceValues.length}`;
    const relationRange = `_Listes!$B$1:$B$${relationValues.length}`;
    const dietaryRange = `_Listes!$C$1:$C$${dietaryOptions.length}`;

    // === Main sheet: 4 companion slots ===
    const COMPANION_SLOTS = 4;
    const sheet = workbook.addWorksheet(t.sheets.responses);

    const columns: ExcelJS.Column[] = [
      { header: t.headers.first_name, key: "first_name", width: 18 },
      { header: t.headers.last_name, key: "last_name", width: 18 },
      { header: t.headers.attendance, key: "attendance", width: 16 },
      { header: t.headers.dietary, key: "dietary", width: 28 },
      { header: t.headers.message, key: "message", width: 35 },
      { header: t.headers.admin_note, key: "admin_note", width: 35 },
    ] as ExcelJS.Column[];

    for (let i = 1; i <= COMPANION_SLOTS; i++) {
      columns.push(
        { header: t.headers.companion_first(i), key: `comp_${i}_first`, width: 20 } as ExcelJS.Column,
        { header: t.headers.companion_last(i), key: `comp_${i}_last`, width: 20 } as ExcelJS.Column,
        { header: t.headers.companion_relation(i), key: `comp_${i}_relation`, width: 22 } as ExcelJS.Column,
      );
    }
    sheet.columns = columns;

    // Example row
    sheet.addRow({
      first_name: "Jean", last_name: "Dupont",
      attendance: t.attendance.confirmed,
      dietary: dietaryOptions[0],
      message: "", admin_note: "",
      comp_1_first: "Marie", comp_1_last: "Dupont", comp_1_relation: t.relations.spouse,
      comp_2_first: "", comp_2_last: "", comp_2_relation: "",
      comp_3_first: "", comp_3_last: "", comp_3_relation: "",
      comp_4_first: "", comp_4_last: "", comp_4_relation: "",
    });

    styleHeaderRow(sheet);

    // Light blue tint on companion columns
    const baseColCount = 6;
    for (let i = 1; i <= COMPANION_SLOTS; i++) {
      const offset = baseColCount + (i - 1) * 3;
      for (let c = 1; c <= 3; c++) {
        sheet.getRow(1).getCell(offset + c).fill = {
          type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" },
        };
      }
    }

    // === Dropdowns ===
    // Col 3: Présence
    addDropdown(sheet, 3, attendanceRange);
    // Col 4: Régime / Allergies
    addDropdown(sheet, 4, dietaryRange, 200, false);
    // Companion relation columns: cols 9, 12, 15, 18 (base 6 + offset per slot)
    for (let i = 1; i <= COMPANION_SLOTS; i++) {
      const relationCol = baseColCount + (i - 1) * 3 + 3;
      addDropdown(sheet, relationCol, relationRange);
    }

    // === Instructions sheet ===
    const instructions = workbook.addWorksheet("Instructions");
    instructions.columns = [
      { header: "Champ", key: "field", width: 35 },
      { header: "Description", key: "desc", width: 80 },
    ] as ExcelJS.Column[];

    instructions.addRows([
      {
        field: t.headers.attendance,
        desc: attendanceValues.join(", "),
      },
      {
        field: t.headers.dietary,
        desc: (locale === "en" ? "Suggested values: " : "Valeurs suggérées : ") + dietaryOptions.join(", "),
      },
      {
        field: locale === "en" ? "Companion N Relation" : "Accompagnant N Lien",
        desc: relationValues.join(", "),
      },
      {
        field: locale === "en" ? "Adding more companions" : "Ajouter plus d'accompagnants",
        desc: locale === "en"
          ? "Add columns: Companion 5 First Name, Companion 5 Last Name, Companion 5 Relation, etc."
          : "Ajoutez des colonnes : Accompagnant 5 Prénom, Accompagnant 5 Nom, Accompagnant 5 Lien, etc.",
      },
    ]);
    styleHeaderRow(instructions);

    const buffer = await workbook.xlsx.writeBuffer();
    return { success: true, data: Buffer.from(buffer).toString("base64") };
  } catch (err) {
    return { success: false, error: "Erreur lors de la génération du modèle." };
  }
}

// ─── Import ────────────────────────────────────────────────────────────────────

export async function importRsvpFromExcel(
  formData: FormData,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "Aucun fichier fourni" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const { data: wedding } = await supabase.from("weddings").select("id").eq("user_id", user.id).single();
    if (!wedding) return { success: false, error: "Mariage introuvable" };

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet =
      workbook.getWorksheet("Réponses RSVP") ||
      workbook.getWorksheet("RSVP Responses") ||
      workbook.worksheets[0];

    if (!worksheet) return { success: false, error: "Feuille introuvable" };

    const rows = sheetToJson(worksheet);
    if (rows.length === 0) return { success: false, error: "Le fichier est vide" };

    const toInsert = rows
      .map((row) => {
        const firstName = String(row["Prénom"] || row["First Name"] || "").trim();
        const lastName = String(row["Nom"] || row["Last Name"] || "").trim();
        if (!firstName && !lastName) return null;

        const rawAttendance = row["Présence"] || row["Attendance"] || "";
        const attendance = rawAttendance in IMPORT_ATTENDANCE
          ? IMPORT_ATTENDANCE[rawAttendance]
          : null;

        // Parse companion columns dynamically: "Accompagnant N Prénom" / "Companion N First Name"
        const participants: { first_name: string; last_name: string; relation_type: string }[] = [];
        let n = 1;
        while (true) {
          const first =
            String(row[`Accompagnant ${n} Prénom`] || row[`Companion ${n} First Name`] || "").trim();
          const last =
            String(row[`Accompagnant ${n} Nom`] || row[`Companion ${n} Last Name`] || "").trim();
          const rawRelation =
            String(row[`Accompagnant ${n} Lien`] || row[`Companion ${n} Relation`] || "").trim();

          // Stop when no more companion columns found
          if (
            row[`Accompagnant ${n} Prénom`] === undefined &&
            row[`Companion ${n} First Name`] === undefined
          ) break;

          if (first || last) {
            participants.push({
              first_name: first,
              last_name: last,
              relation_type: IMPORT_RELATIONS[rawRelation] || rawRelation || "",
            });
          }
          n++;
        }

        return {
          wedding_id: wedding.id,
          name: `${firstName} ${lastName}`.trim(),
          respondent_first_name: firstName,
          respondent_last_name: lastName,
          attendance,
          guest_count: participants.length,
          dietary: String(row["Régime / Allergies"] || row["Dietary / Allergies"] || "").trim() || null,
          message: String(row["Message"] || "").trim() || null,
          admin_note: String(row["Note interne"] || row["Internal Note"] || "").trim() || null,
          participants: participants.length > 0 ? participants : [],
        };
      })
      .filter(Boolean);

    if (toInsert.length === 0) return { success: false, error: "Aucune ligne valide trouvée" };

    const { error: insertError } = await supabase.from("rsvp_responses").insert(toInsert);
    if (insertError) return { success: false, error: insertError.message };

    for (const locale of ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"]) {
      revalidatePath(`/${locale}/rsvp-responses`);
    }

    return { success: true, message: `${toInsert.length} réponse(s) importée(s) avec succès.` };
  } catch (err) {
    console.error("RSVP import error:", err);
    return { success: false, error: "Erreur technique lors de l'import." };
  }
}
