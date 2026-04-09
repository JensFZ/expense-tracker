import { NextRequest, NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/db";
import { setAuthCookie, signPending2faToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Benutzername und Passwort erforderlich." }, { status: 400 });
  }

  const user = verifyUserPassword(username, password);
  if (!user) {
    return NextResponse.json({ error: "Ungültige Anmeldedaten." }, { status: 401 });
  }

  if (user.totp_enabled) {
    const pendingToken = await signPending2faToken(user.id, user.username);
    return NextResponse.json({ totp_required: true, pendingToken });
  }

  await setAuthCookie({ userId: user.id, username: user.username });
  return NextResponse.json({ ok: true, username: user.username, first_name: user.first_name });
}
