"use client";

import { useState, useCallback } from "react";
import { RecurringEntry } from "@/lib/db";
import { Category, resolveCategory } from "@/lib/categories";
import { useAccounts } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus, X, Loader2, CheckCircle2, Pencil, Trash2, AlertTriangle,
  TrendingDown, TrendingUp, Repeat, ToggleLeft, ToggleRight,
} from "lucide-react";

type Frequency = "weekly" | "monthly" | "quarterly" | "semi_annual" | "annual";

const FREQUENCIES: { value: Frequency; label: string; short: string }[] = [
  { value: "weekly",      label: "Wöchentlich",    short: "Wöchentl." },
  { value: "monthly",     label: "Monatlich",      short: "Monatl."   },
  { value: "quarterly",   label: "Vierteljährlich", short: "Quartals." },
  { value: "semi_annual", label: "Halbjährlich",   short: "Halbjährl."},
  { value: "annual",      label: "Jährlich",       short: "Jährlich"  },
];

function advanceDateClient(dateStr: string, frequency: Frequency): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  switch (frequency) {
    case "weekly":      dt.setDate(dt.getDate() + 7);        break;
    case "monthly":     dt.setMonth(dt.getMonth() + 1);      break;
    case "quarterly":   dt.setMonth(dt.getMonth() + 3);      break;
    case "semi_annual": dt.setMonth(dt.getMonth() + 6);      break;
    case "annual":      dt.setFullYear(dt.getFullYear() + 1); break;
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function freqLabel(f: string) {
  return FREQUENCIES.find((x) => x.value === f)?.label ?? f;
}
function freqShort(f: string) {
  return FREQUENCIES.find((x) => x.value === f)?.short ?? f;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function RecurringModal({
  initial, categories, onClose, onSaved,
}: {
  initial?: RecurringEntry;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const today  = new Date().toISOString().split("T")[0];
  type EntryType = "expense" | "income";

  const [type,      setType]      = useState<EntryType>(initial?.type ?? "expense");
  const [amount,    setAmount]    = useState(initial?.amount.toString() ?? "");
  const [category,  setCategory]  = useState(initial?.category ?? "");
  const [note,      setNote]      = useState(initial?.note ?? "");
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(initial?.start_date ?? today);
  const [accountId, setAccountId] = useState<number | null>(initial?.account_id ?? null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const { accounts } = useAccounts();
  const isIncome = type === "income";

  async function handleSave() {
    setError("");
    if (!amount || Number(amount) <= 0) { setError("Gültigen Betrag eingeben."); return; }
    if (!isIncome && !category)         { setError("Kategorie auswählen."); return; }
    if (accounts.length > 0 && accountId === null) { setError("Konto auswählen."); return; }

    setLoading(true);
    try {
      const url    = isEdit ? `/api/recurring/${initial!.id}` : "/api/recurring";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          category: isIncome ? "" : category,
          note: note || null,
          frequency,
          start_date: startDate,
          account_id: accountId,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-md animate-scale-in glass-card p-6 space-y-5 rounded-t-2xl sm:rounded-xl max-h-[85vh] !overflow-y-auto overscroll-contain">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-1" />

        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500">
            {isEdit ? "Dauerauftrag bearbeiten" : "Neuer Dauerauftrag"}
          </p>
          <button onClick={onClose}
            className="w-7 h-7 rounded-md bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Type toggle — only for new entries */}
        {!isEdit && (
          <div className="flex rounded-lg overflow-hidden border border-stone-800 p-0.5 gap-0.5">
            {(["expense", "income"] as EntryType[]).map((t) => {
              const active = type === t;
              return (
                <button key={t} type="button"
                  onClick={() => { setType(t); setCategory(""); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[13px] font-medium transition-all duration-200 tap-target",
                    active
                      ? t === "expense"
                        ? "bg-red-950/60 border border-red-900/50 text-red-300"
                        : "bg-emerald-950/60 border border-emerald-900/50 text-emerald-300"
                      : "text-stone-600 hover:text-stone-400"
                  )}>
                  {t === "expense"
                    ? <><TrendingDown className="w-3.5 h-3.5" /> Ausgabe</>
                    : <><TrendingUp className="w-3.5 h-3.5" /> Einnahme</>}
                </button>
              );
            })}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Betrag</label>
          <div className="relative">
            <input type="number" step="0.01" min="0.01" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="field-input text-[13px] pr-8" autoFocus />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600">€</span>
          </div>
        </div>

        {/* Category — only for expenses */}
        {!isIncome && (
          <div>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Kategorie</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const sel = category === cat.id;
                return (
                  <button key={cat.id} type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all duration-200 tap-target",
                      sel ? "border-current" : "border-stone-800 text-stone-500 hover:border-stone-700"
                    )}
                    style={sel ? { color: cat.color, borderColor: `${cat.color}50`, backgroundColor: `${cat.color}0d` } : {}}>
                    <span className="text-base leading-none">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
            {isIncome ? "Quelle" : "Bezeichnung"}
            <span className="normal-case text-stone-700 tracking-normal ml-1">(optional)</span>
          </label>
          <input type="text"
            placeholder={isIncome ? "z.B. Gehalt, Miete…" : "z.B. Netflix, Miete…"}
            value={note} onChange={(e) => setNote(e.target.value)}
            maxLength={200} className="field-input text-[13px]" />
        </div>

        {/* Account selector */}
        {accounts.length > 0 && (
          <div>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
              Konto
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {accounts.map((acc) => {
                const selected = accountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] transition-all duration-200 tap-target"
                    style={
                      selected
                        ? { borderColor: `${acc.color}60`, backgroundColor: `${acc.color}10`, color: acc.color }
                        : { borderColor: "#292524", color: "#78716c" }
                    }
                  >
                    <span>{acc.icon}</span>
                    <span className="whitespace-nowrap">{acc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Frequency */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Häufigkeit</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {FREQUENCIES.map((f) => (
              <button key={f.value} type="button"
                onClick={() => setFrequency(f.value)}
                className={cn(
                  "py-2 rounded-lg border text-[11px] font-medium transition-all duration-200 tap-target text-center",
                  frequency === f.value
                    ? isIncome
                      ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
                      : "bg-amber-950/50 border-amber-800/50 text-amber-400"
                    : "border-stone-800 text-stone-600 hover:border-stone-700 hover:text-stone-400"
                )}>
                {f.short}
              </button>
            ))}
          </div>
        </div>

        {/* Start date + next occurrence */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
              {isEdit ? "Startdatum" : "Erste Fälligkeit"}
            </label>
            <input type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="field-input text-[13px] [color-scheme:dark]"
              disabled={isEdit} />
            {!isEdit && startDate <= today && (
              <p className="text-[11px] text-amber-500/70 mt-1.5">
                Der erste Eintrag wird sofort für heute erstellt.
              </p>
            )}
          </div>

          {/* Next occurrence */}
          {startDate && (
            <div className={cn(
              "flex items-center justify-between rounded-lg px-4 py-3 border",
              isIncome
                ? "bg-emerald-950/30 border-emerald-900/40"
                : "bg-amber-950/20 border-amber-900/30"
            )}>
              <div className="flex items-center gap-2">
                <Repeat className={cn("w-3.5 h-3.5 flex-shrink-0", isIncome ? "text-emerald-500/60" : "text-amber-500/60")} />
                <span className="text-[12px] text-stone-500">Nächste Buchung danach</span>
              </div>
              <span className={cn(
                "font-numbers text-[13px] font-medium tabular-nums",
                isIncome ? "text-emerald-300" : "text-amber-400"
              )}>
                {format(parseISO(advanceDateClient(startDate, frequency)), "d. MMMM yyyy", { locale: de })}
              </span>
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
            className={cn(
              "flex-1 py-2.5 rounded-lg border text-[13px] transition-colors flex items-center justify-center gap-2 disabled:opacity-60",
              isIncome
                ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/60"
                : "border-amber-800/40 bg-amber-950/40 text-amber-400 hover:bg-amber-950/60"
            )}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isEdit ? "Speichern" : "Einrichten"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm animate-scale-in glass-card p-6 rounded-t-2xl sm:rounded-xl max-h-[85vh] !overflow-y-auto overscroll-contain">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-4" />
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-red-950/50 border border-red-900/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500/80" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-200 mb-1">Dauerauftrag löschen?</p>
            <p className="text-[12px] text-stone-600">Bereits erstellte Einträge bleiben erhalten.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-stone-800 text-stone-500 text-[13px] hover:border-stone-700 transition-colors">
            Abbrechen
          </button>
          <button onClick={() => { setLoading(true); onDeleted(); }} disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-red-900/50 bg-red-950/30 text-red-400 text-[13px] hover:bg-red-950/50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RecurringManager({
  initialEntries, categories,
}: {
  initialEntries: RecurringEntry[];
  categories: Category[];
}) {
  const { accounts } = useAccounts();
  const [entries, setEntries]       = useState<RecurringEntry[]>(initialEntries);
  const [modal, setModal]           = useState<"new" | RecurringEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringEntry | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/recurring");
    setEntries(await res.json());
  }, []);

  async function handleToggle(entry: RecurringEntry) {
    setTogglingId(entry.id);
    await fetch(`/api/recurring/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: entry.is_active === 1 ? 0 : 1 }),
    });
    await reload();
    setTogglingId(null);
  }

  async function handleDelete(entry: RecurringEntry) {
    await fetch(`/api/recurring/${entry.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await reload();
  }

  const active   = entries.filter((e) => e.is_active === 1);
  const inactive = entries.filter((e) => e.is_active === 0);

  function EntryCard({ entry }: { entry: RecurringEntry }) {
    const isIncome = entry.type === "income";
    const cat      = isIncome ? null : resolveCategory(categories, entry.category);
    const nextDate = format(parseISO(entry.next_due), "d. MMM yyyy", { locale: de });
    const accentColor = isIncome ? "#4ade80" : cat?.color ?? "#a8a29e";
    const account  = entry.account_id ? accounts.find((a) => a.id === entry.account_id) : null;

    return (
      <div className="glass-card p-4 group relative overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px opacity-60"
          style={{ background: `linear-gradient(90deg, ${accentColor}80, transparent)` }} />

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}25` }}>
            {isIncome
              ? <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
              : cat?.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-[14px] font-medium text-stone-200 truncate">
                {entry.note || (isIncome ? "Einnahme" : cat?.label ?? entry.category)}
              </p>
              {entry.is_active === 0 && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-600 flex-shrink-0">
                  Pausiert
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Category label */}
              {!isIncome && cat && (
                <span className="text-[11px]" style={{ color: `${cat.color}99` }}>{cat.label}</span>
              )}
              {/* Frequency badge */}
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-600">
                <Repeat className="w-2.5 h-2.5" />
                {freqLabel(entry.frequency)}
              </span>
            </div>

            {/* Account + next due */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {account && (
                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: `${account.color}99` }}>
                  <span>{account.icon}</span>
                  <span>{account.name}</span>
                </span>
              )}
              <p className="text-[11px] text-stone-700">
                Nächste Fälligkeit:{" "}
                <span className="font-numbers text-stone-500">{nextDate}</span>
              </p>
            </div>
          </div>

          {/* Amount + actions */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <p className="font-numbers text-[1.1rem] leading-none tabular-nums"
              style={{ color: isIncome ? "#4ade80" : "rgb(231 229 228)" }}>
              {isIncome ? "+" : "−"}{entry.amount.toFixed(2)}
              <span className="text-sm ml-0.5 opacity-60">€</span>
            </p>

            {/* Action row */}
            <div className="flex items-center gap-1">
              {/* Toggle active */}
              <button onClick={() => handleToggle(entry)} disabled={togglingId === entry.id}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors tap-target"
                style={entry.is_active === 1
                  ? { borderColor: `${accentColor}30`, color: `${accentColor}99`, backgroundColor: `${accentColor}0a` }
                  : { borderColor: "rgba(245,240,232,0.08)", color: "#57534e" }}>
                {togglingId === entry.id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : entry.is_active === 1
                  ? <ToggleRight className="w-3.5 h-3.5" />
                  : <ToggleLeft className="w-3.5 h-3.5" />}
                {entry.is_active === 1 ? "Aktiv" : "Pausiert"}
              </button>

              <button onClick={() => setModal(entry)}
                className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-stone-300 hover:bg-stone-800/60 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setDeleteTarget(entry)}
                className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-red-400 hover:bg-red-950/40 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-stone-600">
          <span className="text-stone-400">{active.length}</span> aktiv
          {inactive.length > 0 && <> · <span className="text-stone-600">{inactive.length} pausiert</span></>}
        </p>
        <button onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-800/40 bg-amber-950/30 text-amber-400 text-[12px] hover:bg-amber-950/50 transition-colors tap-target">
          <Plus className="w-3.5 h-3.5" /> Neuer Dauerauftrag
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-4">
            <Repeat className="w-5 h-5 text-stone-700" />
          </div>
          <p className="text-stone-600 text-sm mb-2">Noch keine Daueraufträge</p>
          <button onClick={() => setModal("new")}
            className="text-amber-500/80 text-[13px] hover:text-amber-400 transition-colors">
            Ersten einrichten →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-700 mb-3">Aktiv</p>
              <div className="space-y-2 stagger">
                {active.map((e) => <EntryCard key={e.id} entry={e} />)}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone-700 mb-3">Pausiert</p>
              <div className="space-y-2 stagger opacity-60">
                {inactive.map((e) => <EntryCard key={e.id} entry={e} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <RecurringModal
          initial={modal === "new" ? undefined : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}
