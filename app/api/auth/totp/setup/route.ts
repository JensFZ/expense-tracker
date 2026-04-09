import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById, setUserTotpSecret } from "@/lib/db";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });

  const { userId } = await req.json();
  const user = getUserById(Number(userId));
  if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

  const totpSecret = new OTPAuth.Secret({ buffer: crypto.randomBytes(20).buffer as ArrayBuffer });

  const totp = new OTPAuth.TOTP({
    issuer: "Ausgaben-Tracker",
    label: user.username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: totpSecret,
  });

  const secretBase32 = totpSecret.base32;
  setUserTotpSecret(Number(userId), secretBase32);

  const qrDataUrl = await QRCode.toDataURL(totp.toString(), { width: 200, margin: 1 });

  return NextResponse.json({ secret: secretBase32, qrDataUrl });
}
