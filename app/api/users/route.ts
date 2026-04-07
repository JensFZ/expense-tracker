import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, insertUser, getUserByUsername } from "@/lib/db";

export function GET() {
  return NextResponse.json(getAllUsers());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password, first_name, last_name, email } = body;

  if (!username || !password || !first_name || !last_name || !email) {
    return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen lang sein." }, { status: 400 });
  }
  if (getUserByUsername(username)) {
    return NextResponse.json({ error: "Benutzername bereits vergeben." }, { status: 409 });
  }

  const user = insertUser(username, password, first_name, last_name, email);
  return NextResponse.json(user, { status: 201 });
}
