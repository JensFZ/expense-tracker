import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserByUsername, getUserById, disableUserTotp } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });

  const { userId, password } = await req.json();
  const user = getUserById(Number(userId));
  if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

  const userWithHash = getUserByUsername(user.username);
  if (!userWithHash || !bcrypt.compareSync(password, userWithHash.password_hash)) {
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  disableUserTotp(Number(userId));
  return NextResponse.json({ ok: true });
}
