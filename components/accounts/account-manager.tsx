"use client";

import { useState, useCallback } from "react";
import { AccountWithBalance } from "@/lib/db";
import { COLOR_PALETTE, EMOJI_LIST } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus, X, Loader2, CheckCircle2, Pencil, Trash2, AlertTriangle,
  Building2, CreditCard, Wallet, TrendingDown, Scale, ToggleLeft, ToggleRight,
} from "lucide-react";

// ─── Account type config ──────────────────────────────────────────────────────

type AccountType = "checking" | "credit" | "cash" | "loan";

const TYPE_CONFIG: Record<AccountType, { label: string; icon: React.ElementType; hint: string }> = {
  checking: { label: "Girokonto",   icon: Building2,     hint: "Bankkonto für den täglichen Zahlungsverkehr" },
  credit:   { label: "Kreditkarte", icon: CreditCard,    hint: "Kreditkarte, negativer Saldo = Schulden" },
  cash:     { label: "Bargeld",     icon: Wallet,        hint: "Portemonnaie oder Bargeldkasse" },
  loan:     { label: "Kredit",      icon: TrendingDown,  hint: "Darlehen oder Schulden, Anfangssaldo negativ" },
};

const ACCOUNT_EMOJIS = ["🏦","🏧","💳","💵","💶","💰","🏠","🚗","✈️","💼","🎓","🏥","🛒","📱","💻","🎯"];

function typeIcon(type: AccountType, className?: string) {
  const Icon = TYPE_CONFIG[type].icon;
  return <Icon className={className ?? "w-4 h-4"} />;
}

// ─── Account Modal ────────────────────────────────────────────────────────────

function AccountModal({ initial, onClose, onSaved }: {
  initial?: AccountWithBalance;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:            initial?.name            ?? "",
    type:            (initial?.type           ?? "checking") as AccountType,
    opening_balance: initial?.opening_balance?.toString() ?? "0",
    icon:            initial?.icon            ?? "🏦",
    color:           initial?.color           ?? "#60a5fa",
  });
  const [tab,     setTab]     = useState<"emoji" | "color">("emoji");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSave() {
    setError("");
    if (!form.name.trim()) { setError("Name ist erforderlich."); return; }
    if (!isFinite(Number(form.opening_balance))) { setError("Ungültiger Anfangssaldo."); return; }
    setLoading(true);
    try {
      const url    = isEdit ? `/api/accounts/${initial!.id}` : "/api/accounts";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            form.name.trim(),
          type:            form.type,
          opening_balance: Number(form.opening_balance),
          icon:            form.icon,
          color:           form.color,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onSaved(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-md animate-scale-in glass-card p-6 space-y-5 rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-y-auto overscroll-contain">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-1" />

        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500">
            {isEdit ? "Konto bearbeiten" : "Neues Konto"}
          </p>
          <button onClick={onClose}
            className="w-7 h-7 rounded-md bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-900/50 border border-stone-800">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: `${form.color}18`, border: `1px solid ${form.color}30` }}>
            {form.icon}
          </div>
          <div>
            <p className="text-[14px] font-medium" style={{ color: form.color }}>
              {form.name || "Kontoname"}
            </p>
            <p className="text-[11px] text-stone-600">
              {TYPE_CONFIG[form.type].label} · Anfangssaldo: {Number(form.opening_balance || 0).toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Name</label>
          <input type="text" placeholder="z.B. DKB Girokonto, Visa…"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={50} className="field-input text-[13px]" autoFocus />
        </div>

        {/* Account type */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Kontotyp</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(TYPE_CONFIG) as [AccountType, typeof TYPE_CONFIG[AccountType]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const sel  = form.type === key;
              return (
                <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all duration-200 tap-target",
                    sel
                      ? "border-amber-800/50 bg-amber-950/40 text-amber-400"
                      : "border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-400"
                  )}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-stone-700 mt-1.5">{TYPE_CONFIG[form.type].hint}</p>
        </div>

        {/* Opening balance */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
            Anfangssaldo
            {form.type === "loan" && (
              <span className="normal-case text-stone-700 tracking-normal ml-1">(negativ für Schulden)</span>
            )}
          </label>
          <div className="relative">
            <input type="number" step="0.01" placeholder="0.00"
              value={form.opening_balance}
              onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              className="field-input text-[13px] pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600">€</span>
          </div>
          {form.type === "loan" && (
            <p className="text-[11px] text-stone-700 mt-1">
              Beispiel: −5000.00 für einen Kredit über 5.000 €
            </p>
          )}
        </div>

        <div className="divider" />

        {/* Icon / Color */}
        <div>
          <div className="flex gap-3 mb-3">
            {(["emoji", "color"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={cn("text-[11px] uppercase tracking-[0.1em] pb-1 border-b transition-colors",
                  tab === t ? "text-amber-400 border-amber-500/50" : "text-stone-600 border-transparent hover:text-stone-400")}>
                {t === "emoji" ? "Icon" : "Farbe"}
              </button>
            ))}
          </div>
          {tab === "emoji" ? (
            <div className="grid grid-cols-8 gap-1 p-1">
              {ACCOUNT_EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setForm({ ...form, icon: emoji })}
                  className={cn("text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    form.icon === emoji ? "bg-stone-700" : "hover:bg-stone-800")}>
                  {emoji}
                </button>
              ))}
              {EMOJI_LIST.slice(0, 16).map((emoji) => (
                <button key={`extra-${emoji}`} type="button" onClick={() => setForm({ ...form, icon: emoji })}
                  className={cn("text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    form.icon === emoji ? "bg-stone-700" : "hover:bg-stone-800")}>
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-10 gap-1.5 p-1">
              {COLOR_PALETTE.map((color) => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                  className={cn("w-7 h-7 rounded-full transition-all duration-150",
                    form.color === color ? "ring-2 ring-offset-2 ring-offset-[#0a0905] scale-110" : "hover:scale-105")}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
            <p className="text-red-400 text-[12px]">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-stone-800 text-stone-500 text-[13px] hover:border-stone-700 hover:text-stone-400 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-amber-800/40 bg-amber-950/40 text-amber-400 text-[13px] hover:bg-amber-950/60 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isEdit ? "Speichern" : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reconcile Modal ──────────────────────────────────────────────────────────

function ReconcileModal({ account, onClose, onSaved }: {
  account: AccountWithBalance;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [actualBalance, setActualBalance] = useState("");
  const [date,          setDate]          = useState(today);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  const diff = actualBalance !== ""
    ? Math.round((Number(actualBalance) - account.tracked_balance) * 100) / 100
    : null;

  async function handleSubmit() {
    if (diff === null || diff === 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual_balance: Number(actualBalance), date }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm animate-scale-in glass-card p-6 space-y-5 rounded-t-2xl sm:rounded-xl">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-1" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{account.icon}</span>
            <div>
              <p className="text-[13px] font-medium text-stone-200">{account.name}</p>
              <p className="text-[11px] text-stone-600">{TYPE_CONFIG[account.type].label}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-md bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current tracked balance */}
        <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800">
          <p className="text-[10px] uppercase tracking-[0.1em] text-stone-600 mb-1">Erfasster Saldo</p>
          <p className={cn("font-numbers text-[1.5rem] leading-none", account.tracked_balance >= 0 ? "text-emerald-400" : "text-red-400")}>
            {account.tracked_balance >= 0 ? "" : "−"}{Math.abs(account.tracked_balance).toFixed(2)}
            <span className="text-base ml-1 opacity-60">€</span>
          </p>
        </div>

        {/* Actual balance input */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
            Tatsächlicher Saldo (laut Bank)
          </label>
          <div className="relative">
            <input type="number" step="0.01" placeholder={account.tracked_balance.toFixed(2)}
              value={actualBalance} onChange={(e) => setActualBalance(e.target.value)}
              className="field-input text-[13px] pr-8" autoFocus />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600">€</span>
          </div>
        </div>

        {/* Live difference preview */}
        {diff !== null && diff !== 0 && (
          <div className={cn(
            "flex items-center justify-between rounded-lg px-4 py-3 border",
            diff > 0
              ? "bg-emerald-950/30 border-emerald-900/40"
              : "bg-red-950/30 border-red-900/40"
          )}>
            <span className="text-[12px] text-stone-500">
              Korrekturbuchung ({diff > 0 ? "Einnahme" : "Ausgabe"})
            </span>
            <span className={cn("font-numbers text-[14px]", diff > 0 ? "text-emerald-300" : "text-red-400")}>
              {diff > 0 ? "+" : "−"}{Math.abs(diff).toFixed(2)} €
            </span>
          </div>
        )}
        {diff === 0 && actualBalance !== "" && (
          <p className="text-[12px] text-stone-600 text-center">Kein Unterschied — Saldo stimmt überein.</p>
        )}

        {/* Date */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Datum der Korrektur</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="field-input text-[13px] [color-scheme:dark]" />
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
            <p className="text-red-400 text-[12px]">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-stone-800 text-stone-500 text-[13px] hover:border-stone-700 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSubmit} disabled={loading || success || diff === null || diff === 0}
            className={cn(
              "flex-1 py-2.5 rounded-lg border text-[13px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50",
              success
                ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400"
                : "border-amber-800/40 bg-amber-950/40 text-amber-400 hover:bg-amber-950/60"
            )}>
            {loading  ? <Loader2 className="w-4 h-4 animate-spin" />   :
             success  ? <><CheckCircle2 className="w-4 h-4" /> Korrigiert</> :
             <><Scale className="w-4 h-4" /> Korrektur anwenden</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ account, onClose, onDeleted }: {
  account: AccountWithBalance;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDeleted(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally { setLoading(false); }
  }

  async function handleDeactivate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: 0 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onDeleted(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm animate-scale-in glass-card p-6 rounded-t-2xl sm:rounded-xl">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-4" />
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-950/50 border border-red-900/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500/80" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-200 mb-1">„{account.name}" entfernen?</p>
            {account.expense_count > 0 ? (
              <p className="text-[12px] text-stone-600">
                Dieses Konto hat <span className="text-stone-400">{account.expense_count}</span> Buchungen
                und kann nicht gelöscht werden. Du kannst es stattdessen deaktivieren.
              </p>
            ) : (
              <p className="text-[12px] text-stone-600">Keine Buchungen — Konto kann gelöscht werden.</p>
            )}
          </div>
        </div>
        {error && <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 mb-3"><p className="text-red-400 text-[12px]">{error}</p></div>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-stone-800 text-stone-500 text-[13px] hover:border-stone-700 transition-colors">
            Abbrechen
          </button>
          {account.expense_count > 0 ? (
            <button onClick={handleDeactivate} disabled={loading}
              className="flex-1 py-2 rounded-lg border border-stone-700/50 bg-stone-800/40 text-stone-400 text-[13px] hover:bg-stone-800/60 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              Deaktivieren
            </button>
          ) : (
            <button onClick={handleDelete} disabled={loading}
              className="flex-1 py-2 rounded-lg border border-red-900/50 bg-red-950/30 text-red-400 text-[13px] hover:bg-red-950/50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AccountManager({ initialAccounts }: { initialAccounts: AccountWithBalance[] }) {
  const [accounts,        setAccounts]        = useState<AccountWithBalance[]>(initialAccounts);
  const [modal,           setModal]           = useState<"new" | AccountWithBalance | null>(null);
  const [reconciling,     setReconciling]     = useState<AccountWithBalance | null>(null);
  const [deleteTarget,    setDeleteTarget]    = useState<AccountWithBalance | null>(null);
  const [togglingId,      setTogglingId]      = useState<number | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
  }, []);

  async function handleToggle(account: AccountWithBalance) {
    setTogglingId(account.id);
    await fetch(`/api/accounts/${account.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: account.is_active === 1 ? 0 : 1 }),
    });
    await reload();
    setTogglingId(null);
  }

  const netWorth = accounts.reduce((s, a) => s + a.tracked_balance, 0);

  // Group by type
  const groups: [AccountType, AccountWithBalance[]][] = (
    ["checking", "credit", "cash", "loan"] as AccountType[]
  ).map((type): [AccountType, AccountWithBalance[]] => [type, accounts.filter((a) => a.type === type)])
   .filter(([, list]) => list.length > 0);

  const groupLabels: Record<AccountType, string> = {
    checking: "Bankkonten",
    credit:   "Kreditkarten",
    cash:     "Bargeld",
    loan:     "Kredite",
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-stone-600">
          <span className="text-stone-400">{accounts.length}</span> Konten
        </p>
        <button onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-800/40 bg-amber-950/30 text-amber-400 text-[12px] hover:bg-amber-950/50 transition-colors tap-target">
          <Plus className="w-3.5 h-3.5" /> Neues Konto
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-5 h-5 text-stone-700" />
          </div>
          <p className="text-stone-600 text-sm mb-2">Noch keine Konten erfasst</p>
          <button onClick={() => setModal("new")}
            className="text-amber-500/80 text-[13px] hover:text-amber-400 transition-colors">
            Erstes Konto anlegen →
          </button>
        </div>
      ) : (
        <>
          {/* Net worth summary */}
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px opacity-60"
              style={{ background: netWorth >= 0 ? "linear-gradient(90deg, #4ade80, transparent)" : "linear-gradient(90deg, #f87171, transparent)" }} />
            <p className="text-[10px] uppercase tracking-[0.12em] text-stone-600 mb-1">Gesamtvermögen</p>
            <p className={cn("font-numbers text-[2rem] leading-none tabular-nums", netWorth >= 0 ? "text-emerald-400" : "text-red-400")}>
              {netWorth >= 0 ? "" : "−"}{Math.abs(netWorth).toFixed(2)}
              <span className="text-lg ml-1.5 opacity-60">€</span>
            </p>
            <p className="text-[11px] text-stone-700 mt-1.5">Summe aller Kontosalden</p>
          </div>

          {/* Grouped accounts */}
          {groups.map(([type, list]) => (
            <div key={type}>
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-700 mb-2">{groupLabels[type]}</p>
              <div className="space-y-2 stagger">
                {list.map((account) => {
                  const bal = account.tracked_balance;
                  const balColor = bal >= 0 ? "#4ade80" : "#f87171";
                  return (
                    <div key={account.id} className={cn("glass-card p-4 group relative overflow-hidden", account.is_active === 0 && "opacity-50")}>
                      {/* Top accent */}
                      <div className="absolute top-0 left-0 right-0 h-px opacity-50"
                        style={{ background: `linear-gradient(90deg, ${account.color}80, transparent)` }} />

                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${account.color}15`, border: `1px solid ${account.color}25` }}>
                          {account.icon}
                        </div>

                        {/* Name + type */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-medium text-stone-200 truncate">{account.name}</p>
                            <span className="flex items-center gap-1 text-[10px] text-stone-600 flex-shrink-0">
                              {typeIcon(account.type, "w-3 h-3")}
                              {TYPE_CONFIG[account.type].label}
                            </span>
                            {account.is_active === 0 && (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-600">Pausiert</span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5">
                            Anfangssaldo: <span className="font-numbers text-stone-500">{account.opening_balance.toFixed(2)} €</span>
                            {account.expense_count > 0 && (
                              <> · <span className="text-stone-600">{account.expense_count} Buchungen</span></>
                            )}
                          </p>
                        </div>

                        {/* Balance + actions */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                          <p className="font-numbers text-[1.25rem] leading-none tabular-nums"
                            style={{ color: balColor }}>
                            {bal >= 0 ? "" : "−"}{Math.abs(bal).toFixed(2)}
                            <span className="text-sm ml-0.5 opacity-60">€</span>
                          </p>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => setReconciling(account)}
                              className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-amber-400 hover:bg-amber-950/40 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target"
                              title="Abgleichen">
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setModal(account)}
                              className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-stone-300 hover:bg-stone-800/60 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleToggle(account)} disabled={togglingId === account.id}
                              className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-stone-400 hover:bg-stone-800/60 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                              {togglingId === account.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : account.is_active === 1
                                ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500/70" />
                                : <ToggleLeft className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setDeleteTarget(account)}
                              className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-red-400 hover:bg-red-950/40 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Last transaction date if any */}
                      {account.expense_count > 0 && (
                        <p className="text-[10px] text-stone-700 mt-2 ml-13 pl-1">
                          {account.expense_count} Buchung{account.expense_count !== 1 ? "en" : ""} erfasst
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {modal !== null && (
        <AccountModal
          initial={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}
      {reconciling && (
        <ReconcileModal
          account={reconciling}
          onClose={() => setReconciling(null)}
          onSaved={reload}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={reload}
        />
      )}
    </div>
  );
}
