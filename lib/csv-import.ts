export interface ParsedRow {
  date: string;
  amount: number;
  type: "expense" | "income";
  note: string;
  externalId: string;
}

/** "-1.500,00" → 1500.00 (always positive; type carries sign semantics) */
function parseGermanAmount(raw: string): number {
  return Math.abs(parseFloat(raw.trim().replace(/\./g, "").replace(",", ".")));
}

/** "07.04.2026" → "2026-04-07" */
function parseGermanDate(raw: string): string {
  const [day, month, year] = raw.trim().split(".");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Join Vwz.0–Vwz.17 (cols 13–30), fall back to recipient name (col 7) */
function buildNote(fields: string[]): string {
  const vwz = fields
    .slice(13, 31)
    .map((f) => f.trim())
    .filter(Boolean)
    .join(" ");
  if (vwz) return vwz.slice(0, 500);
  return (fields[7]?.trim() ?? "").slice(0, 500);
}

/**
 * Build a stable deduplication key.
 * Use End-to-End-Identifikation (col 31) when available and meaningful,
 * otherwise a composite of date + raw amount + first purpose field.
 */
function buildExternalId(fields: string[]): string {
  const e2e = fields[31]?.trim();
  if (e2e && e2e !== "" && e2e !== "NOTPROVIDED") {
    return `e2e:${e2e}`;
  }
  const date   = fields[2]?.trim();
  const amount = fields[4]?.trim();
  const vwz0   = fields[13]?.trim() ?? "";
  return `comp:${date}|${amount}|${vwz0}`;
}

/** "Gutschrift..." → income, everything else → expense */
function parseType(buchungsart: string): "expense" | "income" {
  return buchungsart.trim().startsWith("Gutschrift") ? "income" : "expense";
}

/**
 * Returns true for rows that should be skipped:
 * - Balance/info rows (Buchungsschlüssel 25100/25400)
 * - Rows with empty amount
 * - "Kartenzahlung/-en" rows — these are "vorgemerkte Umsätze" (pending card
 *   transactions shown with "MO ..." reference). They will reappear as
 *   "Debitkartenzahlung" once settled; importing them would create duplicates.
 */
function isSkippedRow(fields: string[]): boolean {
  const key         = fields[5]?.trim();
  const amount      = fields[4]?.trim();
  const buchungsart = fields[6]?.trim();
  if (key === "25100" || key === "25400") return true;
  if (!amount) return true;
  if (buchungsart === "Kartenzahlung/-en") return true;
  return false;
}

export function parseSparkasseCSV(text: string): ParsedRow[] {
  // Strip UTF-8 BOM if present
  const cleaned = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const lines = cleaned.split(/\r?\n/);

  // Skip header row (first line contains "Kontonummer")
  const start = lines[0]?.includes("Kontonummer") ? 1 : 0;
  const result: ParsedRow[] = [];

  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(";");
    if (isSkippedRow(fields)) continue;

    const rawAmount = fields[4]?.trim();
    const amount    = parseGermanAmount(rawAmount);
    if (!isFinite(amount) || amount === 0) continue;

    const rawDate = fields[2]?.trim();
    if (!rawDate || !rawDate.includes(".")) continue;

    result.push({
      date:       parseGermanDate(rawDate),
      amount,
      type:       parseType(fields[6] ?? ""),
      note:       buildNote(fields),
      externalId: buildExternalId(fields),
    });
  }

  return result;
}
