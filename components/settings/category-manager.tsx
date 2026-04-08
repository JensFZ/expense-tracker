"use client";

import { useState, useEffect, useCallback } from "react";
import { Category, COLOR_PALETTE, EMOJI_LIST } from "@/lib/categories";
import { SavingsEntry } from "@/lib/db";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import {
  Pencil, Trash2, Plus, X, Loader2, AlertTriangle,
  CheckCircle2, Target, PiggyBank, ChevronDown, ChevronUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

// ─── Category modal ───────────────────────────────────────────────────────────

function CategoryModal({ initial, onClose, onSave }: {
  initial?: Category; onClose: () => void; onSave: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    label:           initial?.label            ?? "",
    icon:            initial?.icon             ?? "📦",
    color:           initial?.color            ?? "#a8a29e",
    monthly_limit:   initial?.monthly_limit?.toString()   ?? "",
    monthly_savings: initial?.monthly_savings?.toString() ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState<"emoji" | "color">("emoji");

  async function handleSave() {
    setError("");
    if (!form.label.trim()) { setError("Name ist erforderlich."); return; }
    setLoading(true);
    try {
      const url = isEdit ? `/api/categories/${initial!.id}` : "/api/categories";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label:           form.label.trim(),
          icon:            form.icon,
          color:           form.color,
          monthly_limit:   form.monthly_limit   ? Number(form.monthly_limit)   : null,
          monthly_savings: form.monthly_savings ? Number(form.monthly_savings) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Fehler"); }
      onSave(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-md animate-scale-in glass-card p-6 space-y-5 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-xl">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-1" />

        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500">
            {isEdit ? "Bearbeiten" : "Neue Kategorie"}
          </p>
          <button onClick={onClose} className="w-7 h-7 rounded-md bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors">
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
              {form.label || "Kategoriename"}
            </p>
            <p className="text-[11px] text-stone-600">
              {form.monthly_limit   && `Limit: ${Number(form.monthly_limit).toFixed(2)} €  `}
              {form.monthly_savings && `Rücklage: ${Number(form.monthly_savings).toFixed(2)} €/Monat`}
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Name</label>
          <input type="text" placeholder="z.B. Fitness, Urlaub…"
            value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
            maxLength={30} className="field-input text-[13px]" autoFocus />
        </div>

        {/* Icon / Color tabs */}
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
            <div className="grid grid-cols-10 gap-1 max-h-36 overflow-y-auto p-1">
              {EMOJI_LIST.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setForm({ ...form, icon: emoji })}
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

        <div className="divider" />

        {/* Budget limit */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
            Ausgabenlimit <span className="normal-case text-stone-700 tracking-normal">(optional)</span>
          </label>
          <div className="relative">
            <input type="number" step="0.01" min="0" placeholder="z.B. 300.00"
              value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })}
              className="field-input text-[13px] pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 text-sm">€</span>
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Maximale monatliche Ausgaben für diese Kategorie.</p>
        </div>

        {/* Monthly savings */}
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
            Monatliche Rücklage <span className="normal-case text-stone-700 tracking-normal">(optional)</span>
          </label>
          <div className="relative">
            <input type="number" step="0.01" min="0" placeholder="z.B. 100.00"
              value={form.monthly_savings} onChange={(e) => setForm({ ...form, monthly_savings: e.target.value })}
              className="field-input text-[13px] pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 text-sm">€</span>
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Betrag, den du monatlich für dieses Ziel ansparen möchtest.</p>
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

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ category, onClose, onDeleted }: {
  category: Category; onClose: () => void; onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      onDeleted(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm animate-scale-in glass-card p-6 rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-y-auto overscroll-contain">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-4" />
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-red-950/50 border border-red-900/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500/80" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-200 mb-1">„{category.label}" löschen?</p>
            <p className="text-[12px] text-stone-600">Nicht möglich wenn Ausgaben oder Rücklagen zugewiesen sind.</p>
          </div>
        </div>
        {error && <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 mb-4"><p className="text-red-400 text-[12px]">{error}</p></div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-stone-800 text-stone-500 text-[13px] hover:border-stone-700 hover:text-stone-400 transition-colors">Abbrechen</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2 rounded-lg border border-red-900/50 bg-red-950/30 text-red-400 text-[13px] hover:bg-red-950/50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Savings deposit modal ────────────────────────────────────────────────────

function SavingsDepositModal({ category, onClose, onSaved }: {
  category: Category; onClose: () => void; onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [amount, setAmount] = useState("");
  const [date,   setDate]   = useState(today);
  const [note,   setNote]   = useState("");
  const [isWithdraw, setIsWithdraw] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error,   setError]         = useState("");

  async function handleSave() {
    setError("");
    if (!amount || Number(amount) <= 0) { setError("Betrag eingeben."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: category.id,
          amount:  isWithdraw ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
          date,
          note: note || null,
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
      <div className="relative w-full sm:max-w-sm animate-scale-in glass-card p-6 space-y-4 rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-y-auto overscroll-contain">
        <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{category.icon}</span>
            <p className="text-[13px] font-medium text-stone-200">{category.label}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Einzahlen / Abheben toggle */}
        <div className="flex rounded-lg overflow-hidden border border-stone-800 p-0.5 gap-0.5">
          {[false, true].map((withdraw) => (
            <button key={String(withdraw)} type="button"
              onClick={() => setIsWithdraw(withdraw)}
              className={cn(
                "flex-1 py-2 rounded-md text-[12px] font-medium transition-all duration-200",
                isWithdraw === withdraw
                  ? withdraw
                    ? "bg-red-950/60 border border-red-900/50 text-red-300"
                    : "bg-violet-950/60 border border-violet-900/50 text-violet-300"
                  : "text-stone-600 hover:text-stone-400"
              )}>
              {withdraw ? "Abheben" : "Einzahlen"}
            </button>
          ))}
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Datum</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="field-input text-[13px] [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">Notiz</label>
            <input type="text" placeholder="Optional…" value={note} onChange={(e) => setNote(e.target.value)}
              className="field-input text-[13px]" />
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2"><p className="text-red-400 text-[12px]">{error}</p></div>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-stone-800 text-stone-500 text-[13px] hover:border-stone-700 hover:text-stone-400 transition-colors">Abbrechen</button>
          <button onClick={handleSave} disabled={loading}
            className={cn(
              "flex-1 py-2.5 rounded-lg border text-[13px] transition-colors flex items-center justify-center gap-2 disabled:opacity-60",
              isWithdraw
                ? "border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-950/50"
                : "border-violet-900/50 bg-violet-950/30 text-violet-400 hover:bg-violet-950/50"
            )}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isWithdraw ? "Abheben" : "Einzahlen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Savings entries list ─────────────────────────────────────────────────────

function SavingsEntries({ categoryId, color }: { categoryId: string; color: string }) {
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/savings?category_id=${categoryId}`);
    setEntries(await res.json());
    setLoading(false);
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    await fetch(`/api/savings/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) return <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-stone-600" /></div>;
  if (entries.length === 0) return <p className="text-[12px] text-stone-600 py-2 text-center">Noch keine Einträge</p>;

  return (
    <div className="space-y-1 mt-2">
      {entries.map((e) => (
        <div key={e.id} className="flex items-center gap-2 py-1.5 group">
          <span className={`font-numbers text-[12px] w-20 flex-shrink-0 ${e.amount < 0 ? "text-red-400" : "text-violet-300"}`}>
            {e.amount > 0 ? "+" : ""}{e.amount.toFixed(2)} €
          </span>
          <span className="text-[11px] text-stone-600 flex-shrink-0">
            {format(parseISO(e.date), "d. MMM", { locale: de })}
          </span>
          <span className="text-[12px] text-stone-500 flex-1 truncate">{e.note || "–"}</span>
          <button onClick={() => handleDelete(e.id)}
            className="sm:opacity-0 sm:group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-stone-700 hover:text-red-400 transition-all tap-target">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CategoryManager({ monthSpending }: { monthSpending: Record<string, number> }) {
  const { categories, loading, reload } = useCategories();
  const [savingsTotal, setSavingsTotal] = useState<Record<string, number>>({});
  const [modal, setModal]               = useState<"new" | Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [depositTarget, setDepositTarget] = useState<Category | null>(null);
  const [expandedSavings, setExpandedSavings] = useState<string | null>(null);

  const loadSavings = useCallback(async () => {
    const res = await fetch("/api/savings");
    const entries: SavingsEntry[] = await res.json();
    const totals: Record<string, number> = {};
    entries.forEach((e) => { totals[e.category_id] = (totals[e.category_id] ?? 0) + e.amount; });
    setSavingsTotal(totals);
  }, []);

  useEffect(() => { loadSavings(); }, [loadSavings]);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-amber-600/50 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-stone-600"><span className="text-stone-400">{categories.length}</span> Kategorien</p>
        <button onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-800/40 bg-amber-950/30 text-amber-400 text-[12px] hover:bg-amber-950/50 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Neue Kategorie
        </button>
      </div>

      <div className="space-y-2 stagger">
        {categories.map((cat) => {
          const spent     = monthSpending[cat.id] ?? 0;
          const hasLimit  = cat.monthly_limit   !== null && cat.monthly_limit   > 0;
          const hasSaving = cat.monthly_savings !== null && cat.monthly_savings > 0;
          const progress  = hasLimit ? Math.min((spent / cat.monthly_limit!) * 100, 100) : 0;
          const isOver    = hasLimit && spent > cat.monthly_limit!;
          const isNear    = hasLimit && !isOver && progress >= 80;
          const savBal    = savingsTotal[cat.id] ?? 0;
          const isExpanded = expandedSavings === cat.id;

          return (
            <div key={cat.id} className="glass-card glass-card-hover animate-fade-up group p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}25` }}>
                  {cat.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-[14px] font-medium text-stone-200">{cat.label}</p>
                    {isOver  && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-950/60 border border-red-900/50 text-red-400">Überschritten</span>}
                    {isNear && !isOver && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-900/50 text-amber-400">Fast voll</span>}
                  </div>

                  {/* Limit bar */}
                  {hasLimit && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] text-stone-600">
                          <span className="font-numbers" style={{ color: isOver ? "#f87171" : isNear ? "#fbbf24" : "#a8a29e" }}>{spent.toFixed(2)} €</span>
                          {" / "}
                          <span className="font-numbers text-stone-600">{cat.monthly_limit!.toFixed(2)} € Limit</span>
                        </p>
                        <div className="flex items-center gap-1"><Target className="w-3 h-3 text-stone-700" /><span className="font-numbers text-[11px] text-stone-600">{progress.toFixed(0)}%</span></div>
                      </div>
                      <div className="h-1 rounded-full bg-stone-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress}%`, backgroundColor: isOver ? "#ef4444" : isNear ? "#f59e0b" : cat.color, opacity: 0.8 }} />
                      </div>
                    </div>
                  )}

                  {/* Savings summary */}
                  {hasSaving && (
                    <div className={cn("flex items-center justify-between", hasLimit ? "mt-2" : "")}>
                      <p className="text-[11px] text-stone-600">
                        <PiggyBank className="w-3 h-3 inline mr-1 text-violet-500/60" />
                        <span className="font-numbers text-violet-300">{savBal.toFixed(2)} €</span>
                        <span className="text-stone-600"> angespart · Ziel: </span>
                        <span className="font-numbers text-stone-500">{cat.monthly_savings!.toFixed(2)} €/Monat</span>
                      </p>
                    </div>
                  )}

                  {!hasLimit && !hasSaving && (
                    <p className="text-[12px] text-stone-600">
                      {spent > 0 ? <><span className="font-numbers text-stone-400">{spent.toFixed(2)} €</span> diesen Monat</> : "Kein Limit · Keine Rücklage"}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasSaving && (
                    <button onClick={() => setExpandedSavings(isExpanded ? null : cat.id)}
                      className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-violet-400 hover:bg-violet-950/40 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {hasSaving && (
                    <button onClick={() => setDepositTarget(cat)}
                      className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-violet-400 hover:bg-violet-950/40 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                      <PiggyBank className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setModal(cat)}
                    className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-stone-300 hover:bg-stone-800/60 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(cat)}
                    className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-red-400 hover:bg-red-950/40 transition-colors sm:opacity-0 sm:group-hover:opacity-100 tap-target">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded savings history */}
              {isExpanded && hasSaving && (
                <div className="mt-3 pt-3 border-t border-stone-800/60 ml-13">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-stone-600 mb-1">Verlauf</p>
                  <SavingsEntries
                    categoryId={cat.id}
                    color={cat.color}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal !== null && (
        <CategoryModal
          initial={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={() => { reload(); loadSavings(); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { reload(); loadSavings(); }}
        />
      )}
      {depositTarget && (
        <SavingsDepositModal
          category={depositTarget}
          onClose={() => setDepositTarget(null)}
          onSaved={loadSavings}
        />
      )}
    </div>
  );
}
