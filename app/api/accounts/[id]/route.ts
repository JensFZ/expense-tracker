import { NextRequest, NextResponse } from "next/server";
import { getAccountBalances, getAccountById, updateAccount, deleteAccount } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = getAccountBalances();
  const account = all.find((a) => a.id === Number(id));
  if (!account) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccountById(Number(id));
  if (!account) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  try {
    const body = await req.json();
    const updated = updateAccount(
      Number(id),
      body.name        !== undefined ? String(body.name).trim()    : account.name,
      body.type        !== undefined ? body.type                    : account.type,
      body.opening_balance !== undefined ? Number(body.opening_balance) : account.opening_balance,
      body.icon        !== undefined ? body.icon                    : account.icon,
      body.color       !== undefined ? body.color                   : account.color,
      body.sort_order  !== undefined ? Number(body.sort_order)      : account.sort_order,
      body.is_active   !== undefined ? (body.is_active ? 1 : 0)    : account.is_active
    );
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = deleteAccount(Number(id));
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });
  return NextResponse.json({ ok: true });
}
