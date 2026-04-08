import { NextRequest, NextResponse } from "next/server";
import { getAllRecurring, insertRecurring, generateDueEntries } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getAllRecurring());
}

export async function POST(req: NextRequest) {
  try {
    const { type, amount, category, note, company, frequency, start_date, account_id } = await req.json();
    if (!amount || amount <= 0)   return NextResponse.json({ error: "Ungültiger Betrag" }, { status: 400 });
    if (!frequency)               return NextResponse.json({ error: "Häufigkeit fehlt" }, { status: 400 });
    if (!start_date)              return NextResponse.json({ error: "Startdatum fehlt" }, { status: 400 });
    if (type === "expense" && !category) return NextResponse.json({ error: "Kategorie fehlt" }, { status: 400 });

    const entry = insertRecurring(
      type ?? "expense",
      Number(amount),
      category ?? "",
      note ?? null,
      frequency,
      start_date,
      { accountId: account_id ? Number(account_id) : null, company: company ?? null }
    );
    // Generate immediately if start_date is today or past
    generateDueEntries();
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
