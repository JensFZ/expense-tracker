import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserByUsername, getUserById, enableUserTotp } from "@/lib/db";
import * as OTPAuth from "otpauth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });

  const { userId, code } = await req.json();
  const user = getUserById(Number(userId));
  if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

  const userWithHash = getUserByUsername(user.username);
  if (!userWithHash?.totp_secret) {
    return NextResponse.json({ error: "Kein TOTP-Secret gefunden. Bitte Setup neu starten." }, { status: 400 });
  }

  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(userWithHash.totp_secret),
  });

  const delta = totp.validate({ token: String(code).replaceAll(/\s/g, ""), window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Ungültiger Code. Bitte erneut versuchen." }, { status: 400 });
  }

  enableUserTotp(Number(userId));
  return NextResponse.json({ ok: true });
}
