export const dynamic = "force-dynamic";

import { getAllUsers } from "@/lib/db";
import { UserManager } from "@/components/users/user-manager";

export default function UsersPage() {
  const users = getAllUsers();

  return (
    <div className="max-w-2xl mx-auto space-y-7">
      <div className="animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 mb-1.5">
          Verwaltung
        </p>
        <h1 className="font-display text-3xl text-stone-100">Benutzer</h1>
        <p className="text-stone-500 text-[13px] mt-2">
          Verwalte die Benutzerkonten dieser Anwendung. Passwörter werden sicher gehasht gespeichert.
        </p>
      </div>

      <div className="divider" />

      <UserManager initialUsers={users} />
    </div>
  );
}
