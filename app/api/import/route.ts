import { NextRequest } from "next/server";
import { insertExpenseWithExternalId } from "@/lib/db";
import { parseSparkasseCSV } from "@/lib/csv-import";

export async function POST(request: NextRequest) {
  try {
    const formData  = await request.formData();
    const file      = formData.get("file") as File | null;
    const accountId = formData.get("account_id");

    if (!file) {
      return Response.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return Response.json({ error: "Nur CSV-Dateien werden unterstützt" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseSparkasseCSV(text);
    const accId = accountId ? Number(accountId) : null;

    let imported = 0;
    let skipped  = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const result = insertExpenseWithExternalId(
          row.amount,
          "sonstiges",
          row.date,
          row.note || null,
          row.type,
          accId,
          row.externalId
        );
        if (result === null) skipped++;
        else imported++;
      } catch (e) {
        errors.push(`${row.date} ${row.amount}: ${String(e)}`);
      }
    }

    return Response.json({ imported, skipped, errors });
  } catch (e) {
    console.error("[import]", e);
    return Response.json({ error: "Importfehler: " + String(e) }, { status: 500 });
  }
}
