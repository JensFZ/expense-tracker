import { NextRequest } from "next/server";
import { getSavingsEntries, insertSavingsEntry } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get("category_id") ?? undefined;
    return Response.json(getSavingsEntries(categoryId));
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
