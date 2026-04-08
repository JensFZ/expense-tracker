import { getCompanySuggestions } from "@/lib/db";

export async function GET() {
  try {
    return Response.json(getCompanySuggestions());
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
