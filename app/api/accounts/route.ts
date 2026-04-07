import { NextRequest, NextResponse } from "next/server";
import { getAccountBalances, insertAccount } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getAccountBalances());
}

export async function POST(req: NextRequest) {
  try {
    const { name, type, opening_balance, icon, color } = await req.json();
    if (!name?.trim())  return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    if (!["checking", "credit", "cash", "loan"].includes(type))
      return NextResponse.json({ error: "Ungültiger Kontotyp" }, { status: 400 });
    if (!isFinite(Number(opening_balance)))
      return NextResponse.json({ error: "Ungültiger Anfangssaldo" }, { status: 400 });

    const existing = getAccountBalances();
    const sort_order = existing.length > 0 ? Math.max(...existing.map((a) => a.sort_order)) + 1 : 0;

    const account = insertAccount(
      name.trim(), type, Number(opening_balance),
      icon ?? "🏦", color ?? "#60a5fa", sort_order
    );
    return NextResponse.json(account, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
