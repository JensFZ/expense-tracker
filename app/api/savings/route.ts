import { NextRequest } from "next/server";
import { getSavingsEntries, insertSavingsEntry } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("category_id") ?? undefined;
    const from = searchParams.get("from");
    const to   = searchParams.get("to");

    let entries = getSavingsEntries(categoryId);
    if (from) entries = entries.filter((e) => e.date >= from);
    if (to)   entries = entries.filter((e) => e.date <= to);

    return Response.json(entries);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, amount, date, note } = body;

    if (!category_id || !amount || !date) {
      return Response.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }
    if (Number(amount) === 0) {
      return Response.json({ error: "Betrag darf nicht 0 sein" }, { status: 400 });
    }

    const entry = insertSavingsEntry(category_id, Number(amount), date, note || null);
    return Response.json(entry, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
