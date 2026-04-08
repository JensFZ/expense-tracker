import { createWorker } from "tesseract.js";
import { NextResponse } from "next/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function parseGermanNumber(s: string): number | null {
  // "1.234,99" → 1234.99  |  "12,99" → 12.99  |  "12.99" → 12.99
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

function extractAmount(text: string): number | null {
  const lines = text.split("\n");

  // High-priority patterns: check each across all lines in order
  const highPriority: RegExp[] = [
    /\bsumme\b[^0-9]*(\d{1,4}[.,]\d{2})/i,
    /\bzu\s*zahlen\b[^0-9]*(\d{1,4}[.,]\d{2})/i,
    /\bendbetrag\b[^0-9]*(\d{1,4}[.,]\d{2})/i,
    /\btotal\b[^0-9]*(\d{1,4}[.,]\d{2})/i,
    /\bec[.\s-]?cash\b[^0-9]*(\d{1,4}[.,]\d{2})/i,
    /\bgegeben\b[^0-9]*(\d{1,4}[.,]\d{2})/i,
    /\bbar\b[^0-9]*(\d{1,4}[.,]\d{2})/i,
  ];

  for (const pattern of highPriority) {
    for (const line of lines) {
      const m = line.match(pattern);
      if (m) {
        const val = parseGermanNumber(m[1]);
        if (val !== null) return val;
      }
    }
  }

  // Lower priority: "Gesamtbetrag" line — take the LAST number (= Brutto, not Netto)
  for (const line of lines) {
    if (/gesamtbetrag/i.test(line)) {
      const all = [...line.matchAll(/(\d{1,4}[.,]\d{2})/g)];
      if (all.length > 0) {
        const val = parseGermanNumber(all[all.length - 1][1]);
        if (val !== null) return val;
      }
    }
  }

  // Fallback: largest monetary value in bottom half of receipt
  const bottomLines = lines.slice(Math.floor(lines.length / 2));
  const moneyPattern = /\b(\d{1,4}[.,]\d{2})\b/g;
  let best: number | null = null;
  for (const line of bottomLines) {
    let m: RegExpExecArray | null;
    while ((m = moneyPattern.exec(line)) !== null) {
      const val = parseGermanNumber(m[1]);
      if (val !== null && (best === null || val > best)) best = val;
    }
  }
  return best;
}

function extractCompany(text: string): string | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  for (const line of lines.slice(0, 5)) {
    // Skip lines that are purely numbers, dates, or special characters
    if (/^[\d\s.,:\-\/\\*#]+$/.test(line)) continue;
    if (line.length < 2 || line.length > 60) continue;
    return line.slice(0, 60);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Kein Bild übergeben" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Bild zu groß (max. 10 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const cachePath = process.env.TESSDATA_PATH ?? "/tmp/tessdata";

    const worker = await createWorker(["deu", "eng"], 1, {
      cachePath,
      logger: () => {},
    });

    let text = "";
    try {
      const { data } = await worker.recognize(buffer);
      text = data.text;
    } finally {
      await worker.terminate();
    }

    const amount  = extractAmount(text);
    const company = extractCompany(text);

    return NextResponse.json({ amount, company });
  } catch {
    // Never crash — user can always enter manually
    return NextResponse.json({ amount: null, company: null });
  }
}
