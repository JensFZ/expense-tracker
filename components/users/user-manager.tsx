"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { User, UserPlus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { User as UserType } from "@/lib/db";

interface Props {
  initialUsers: UserType[];
}

const EMPTY_FORM = {
  username: "",
  password: "",
  passwordConfirm: "",
  first_name: "",
  last_name: "",
  email: "",
};

export function UserManager({ initialUsers }: Props) {
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<UserType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setShowPw(false);
    setError(null);
    setEditTarget(null);
    setDialogMode("add");
  }

  function openEdit(u: UserType) {
    setForm({ ...EMPTY_FORM, username: u.username, first_name: u.first_name, last_name: u.last_name, email: u.email });
    setShowPw(false);
    setError(null);
    setEditTarget(u);
    setDialogMode("edit");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (dialogMode === "add" || form.password) {
      if (form.password !== form.passwordConfirm) {
        setError("Passwörter stimmen nicht überein.");
        return;
      }
      if (form.password.length < 8) {
        setError("Passwort muss mindestens 8 Zeichen lang sein.");
        return;
      }
    }
    setLoading(true);
    try {
      let res: Response;
      if (dialogMode === "add") {
        res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.username, password: form.password, first_name: form.first_name, last_name: form.last_name, email: form.email }),
        });
      } else {
        res = await fetch(`/api/users/${editTarget!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.username, password: form.password || undefined, first_name: form.first_name, last_name: form.last_name, email: form.email }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Speichern.");
        return;
      }
      // Refresh list
      const list = await fetch("/api/users").then((r) => r.json());
      setUsers(list);
      setDialogMode(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Fehler beim Löschen.");
        return;
      }
      setUsers((u) => u.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-stone-400 text-[13px]">{users.length} Benutzer registriert</p>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          Benutzer hinzufügen
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-stone-800 bg-stone-900/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-stone-200 truncate">
                  {u.first_name} {u.last_name}
                </p>
                <p className="text-[11px] text-stone-500 truncate">
                  @{u.username} · {u.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
              <Button variant="ghost" size="sm" onClick={() => openEdit(u)} className="h-7 w-7 p-0">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(u)}
                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Neuer Benutzer" : "Benutzer bearbeiten"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-first_name">Vorname</Label>
                <Input id="u-first_name" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-last_name">Nachname</Label>
                <Input id="u-last_name" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">E-Mail-Adresse</Label>
              <Input id="u-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-username">Benutzername</Label>
              <Input id="u-username" value={form.username} onChange={(e) => update("username", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-password">
                Passwort {dialogMode === "edit" && <span className="text-stone-500 font-normal">(leer lassen = unverändert)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="u-password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required={dialogMode === "add"}
                  placeholder={dialogMode === "add" ? "Mindestens 8 Zeichen" : "Neues Passwort (optional)"}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300" tabIndex={-1}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {(dialogMode === "add" || form.password) && (
              <div className="space-y-1.5">
                <Label htmlFor="u-pwconfirm">Passwort bestätigen</Label>
                <Input id="u-pwconfirm" type={showPw ? "text" : "password"} value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)} required={dialogMode === "add" || !!form.password} />
              </div>
            )}
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">{error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogMode(null)}>Abbrechen</Button>
              <Button type="submit" disabled={loading}>{loading ? "Speichern…" : "Speichern"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Benutzer löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-stone-400">
            <strong className="text-stone-200">{deleteTarget?.first_name} {deleteTarget?.last_name}</strong> (@{deleteTarget?.username}) wird unwiderruflich gelöscht.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Löschen…" : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
