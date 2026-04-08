import { NextRequest } from "next/server";
import { getAllExpenses, insertExpense } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const search   = searchParams.get("search");
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");
    const type     = searchParams.get("type") as "expense" | "income" | null;

    let expenses = getAllExpenses(type ?? undefined);

    if (category && category !== "all") expenses = expenses.filter((e) => e.category === category);
    if (search) {
      const q = search.toLowerCase();
      const qNormalized = q.replace(",", ".");
      expenses = expenses.filter((e) =>
        e.note?.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.company?.toLowerCase().includes(q) ||
        e.amount.toString().includes(qNormalized)
      );
    }
    if (from) expenses = expenses.filter((e) => e.date >= from);
    if (to)   expenses = expenses.filter((e) => e.date <= to);

    return Response.json(expenses);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, category, date, note, type, account_id, company } = body;

    if (!amount || !date) {
      return Response.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const entryType = type === "income" ? "income" : "expense";
    const accountId = account_id ? Number(account_id) : null;
    const expense = insertExpense(Number(amount), category || "", date, note || null, entryType, accountId, company || null);
    return Response.json(expense, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
