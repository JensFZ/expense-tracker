import { NextResponse } from "next/server";
import { getUserCount } from "@/lib/db";

export function GET() {
  const count = getUserCount();
  return NextResponse.json({ hasUsers: count > 0 });
}
