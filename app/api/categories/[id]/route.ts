import { NextRequest } from "next/server";
import { updateCategory, deleteCategory, getCategoryById, getCategoryExpenseCount } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cat = getCategoryById(id);
    if (!cat) return Response.json({ error: "Nicht gefunden" }, { status: 404 });
    return Response.json({ ...cat, expenseCount: getCategoryExpenseCount(id) });
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
    const { label, icon, color, monthly_limit, monthly_savings } = body;

    if (!label?.trim() || !icon || !color) {
      return Response.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const cat = updateCategory(
      id, label.trim(), icon, color,
      monthly_limit ? Number(monthly_limit) : null,
      monthly_savings ? Number(monthly_savings) : null
    );
    if (!cat) return Response.json({ error: "Nicht gefunden" }, { status: 404 });
    return Response.json(cat);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = deleteCategory(id);
    if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
