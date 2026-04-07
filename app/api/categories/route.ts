import { NextRequest } from "next/server";
import { getAllCategories, insertCategory } from "@/lib/db";

export async function GET() {
  try {
    return Response.json(getAllCategories());
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, icon, color, monthly_limit, monthly_savings } = body;

    if (!label?.trim() || !icon || !color) {
      return Response.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const id = label
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      || `cat-${Date.now()}`;

    const existing = getAllCategories();
    let finalId = id;
    if (existing.some((c) => c.id === finalId)) {
      let n = 2;
      while (existing.some((c) => c.id === `${id}-${n}`)) n++;
      finalId = `${id}-${n}`;
    }

    const maxOrder = existing.reduce((m, c) => Math.max(m, c.sort_order), -1);
    const category = insertCategory(
      finalId, label.trim(), icon, color,
      monthly_limit ? Number(monthly_limit) : null,
      monthly_savings ? Number(monthly_savings) : null,
      maxOrder + 1
    );
    return Response.json(category, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
