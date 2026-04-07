import { NextRequest } from "next/server";
import { deleteSavingsEntry } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!deleteSavingsEntry(Number(id))) {
      return Response.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
