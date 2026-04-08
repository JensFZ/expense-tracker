import { NextRequest } from "next/server";
import { updateExpense, deleteExpense, getExpenseById } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = getExpenseById(Number(id));
    if (!expense) return Response.json({ error: "Nicht gefunden" }, { status: 404 });
    return Response.json(expense);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, category, date, note, type, account_id, company } = body;

    if (!amount || !date) {
      return Response.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const entryType = type === "income" ? "income" : "expense";
    const accountId = account_id !== undefined ? (account_id ? Number(account_id) : null) : undefined;
    const expense = updateExpense(Number(id), Number(amount), category || "", date, note || null, entryType, accountId ?? null, company || null);
    if (!expense) return Response.json({ error: "Nicht gefunden" }, { status: 404 });
    return Response.json(expense);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!deleteExpense(Number(id))) return Response.json({ error: "Nicht gefunden" }, { status: 404 });
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
