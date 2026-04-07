import { NextRequest, NextResponse } from "next/server";
import { getAccountBalances, insertExpense } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = getAccountBalances();
  const account = all.find((a) => a.id === Number(id));
  if (!account) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (!account.is_active) return NextResponse.json({ error: "Konto ist deaktiviert" }, { status: 409 });

  try {
    const { actual_balance, date } = await req.json();
    if (!isFinite(Number(actual_balance))) return NextResponse.json({ error: "Ungültiger Saldo" }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Datum fehlt" }, { status: 400 });

    const diff = Math.round((Number(actual_balance) - account.tracked_balance) * 100) / 100;
    if (diff === 0) return NextResponse.json({ error: "Kein Unterschied — Saldo stimmt bereits überein." }, { status: 400 });

    const type   = diff > 0 ? "income" : "expense";
    const amount = Math.abs(diff);
    const adjustment = insertExpense(amount, "", date, "Saldenkorrektur", type, account.id);

    return NextResponse.json({
      adjustment,
      tracked_balance_before: account.tracked_balance,
      tracked_balance_after:  Math.round((account.tracked_balance + diff) * 100) / 100,
      difference: diff,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
