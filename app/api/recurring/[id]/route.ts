import { NextRequest, NextResponse } from "next/server";
import { getRecurringById, updateRecurring, deleteRecurring } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getRecurringById(Number(id));
  if (!entry) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  try {
    const body = await req.json();
    const amount    = body.amount    === undefined ? entry.amount    : Number(body.amount);
    const category  = body.category  ?? entry.category;
    const note      = body.note      ?? entry.note;
    const frequency = body.frequency ?? entry.frequency;
    const isActive  = body.is_active === undefined ? entry.is_active : Number(!!body.is_active);
    const rawAccountId = body.account_id ? Number(body.account_id) : null;
    const accountId = body.account_id === undefined ? entry.account_id : rawAccountId;
    const company   = body.company === undefined ? entry.company : (body.company || null);
    const updated = updateRecurring(Number(id), amount, category, note, frequency, isActive, { accountId, company });
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
