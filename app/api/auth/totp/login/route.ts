import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/db";
import { verifyToken, setAuthCookie } from "@/lib/auth";
import * as OTPAuth from "otpauth";

export async function POST(req: NextRequest) {
  const { pendingToken, code } = await req.json();
  if (!pendingToken || !code) {
    return NextResponse.json({ error: "Token und Code erforderlich." }, { status: 400 });
  }

  const payload = await verifyToken(pendingToken);
  if (!payload || !("pending2fa" in payload) || !payload.pending2fa) {
    return NextResponse.json({ error: "Ungültiges oder abgelaufenes Token." }, { status: 401 });
  }

  const user = getUserByUsername(payload.username);
  if (!user || !user.totp_secret || !user.totp_enabled) {
    return NextResponse.json({ error: "2FA nicht konfiguriert." }, { status: 400 });
  }

  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.totp_secret),
  });

  const delta = totp.validate({ token: String(code).replaceAll(/\s/g, ""), window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Ungültiger Code." }, { status: 401 });
  }

  await setAuthCookie({ userId: user.id, username: user.username });
  return NextResponse.json({ ok: true });
}
