import { NextRequest, NextResponse } from "next/server";
import { getRecurringById, updateRecurring, deleteRecurring } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getRecurringById(Number(id));
  if (!entry) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  try {
    const body = await req.json();
    const updated = updateRecurring(
      Number(id),
      body.amount    !== undefined ? Number(body.amount)          : entry.amount,
      body.category  !== undefined ? body.category                : entry.category,
      body.note      !== undefined ? body.note                    : entry.note,
      body.frequency !== undefined ? body.frequency               : entry.frequency,
      body.is_active !== undefined ? (body.is_active ? 1 : 0)    : entry.is_active,
      body.account_id !== undefined ? (body.account_id ? Number(body.account_id) : null) : entry.account_id
    );
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteRecurring(Number(id));
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
}
