import { NextRequest, NextResponse } from "next/server";
import { getUserById, getUserByUsername, updateUser, updateUserPassword, deleteUser, getUserCount } from "@/lib/db";

export function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const user = getUserById(Number(id));
    if (!user) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    return NextResponse.json(user);
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { username, first_name, last_name, email, password } = body;

  if (!username || !first_name || !last_name || !email) {
    return NextResponse.json({ error: "Alle Pflichtfelder sind erforderlich." }, { status: 400 });
  }

  const existing = getUserByUsername(username);
  if (existing && existing.id !== Number(id)) {
    return NextResponse.json({ error: "Benutzername bereits vergeben." }, { status: 409 });
  }

  const user = updateUser(Number(id), username, first_name, last_name, email);
  if (!user) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen lang sein." }, { status: 400 });
    }
    updateUserPassword(Number(id), password);
  }

  return NextResponse.json(user);
}

export function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    if (getUserCount() <= 1) {
      return NextResponse.json({ error: "Der letzte Benutzer kann nicht gelöscht werden." }, { status: 400 });
    }
    const ok = deleteUser(Number(id));
    if (!ok) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    return NextResponse.json({ ok: true });
  });
}
