import { NextRequest } from "next/server";
import { getExpensesLastNMonths } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const months = parseInt(request.nextUrl.searchParams.get("months") ?? "6", 10);
    const allowed = [3, 6, 12];
    const n = allowed.includes(months) ? months : 6;
    return Response.json(getExpensesLastNMonths(n));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
