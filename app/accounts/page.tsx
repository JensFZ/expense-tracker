import { getAccountBalances } from "@/lib/db";
import { AccountManager } from "@/components/accounts/account-manager";

export default async function AccountsPage() {
  const accounts = getAccountBalances();

  return (
    <div className="max-w-2xl mx-auto space-y-7">
      <div className="animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.12em] text-stone-600 mb-2">Kontoverwaltung</p>
        <h1 className="font-display text-3xl sm:text-4xl text-stone-100 leading-tight">Konten</h1>
        <p className="text-stone-500 text-[13px] mt-2">
          Verwalte deine Bankkonten, Kreditkarten, Bargeld und Kredite.
          Salden werden automatisch aus deinen Buchungen berechnet.
        </p>
      </div>
      <div className="divider" />
      <AccountManager initialAccounts={accounts} />
    </div>
  );
}
