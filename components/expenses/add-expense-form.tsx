"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { Camera, CheckCircle2, Loader2, TrendingDown, TrendingUp, X } from "lucide-react";

type EntryType = "expense" | "income";

export function AddExpenseForm({
  initialData,
  expenseId,
  onSuccess,
}: {
  initialData?: { amount: string; category: string; date: string; note: string; company?: string; type?: EntryType; accountId?: number | null };
  expenseId?: number;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { categories, loading: catsLoading } = useCategories();
  const { accounts } = useAccounts();
  const today = new Date().toISOString().split("T")[0];

  const [entryType, setEntryType] = useState<EntryType>(initialData?.type ?? "expense");
  const [accountId, setAccountId] = useState<number | null>(initialData?.accountId ?? null);
  const [form, setForm] = useState({
    amount:   initialData?.amount   ?? "",
    category: initialData?.category ?? "",
    date:     initialData?.date     ?? today,
    note:     initialData?.note     ?? "",
    company:  initialData?.company  ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  type ScanStatus = "idle" | "scanning" | "done" | "error";
  const [scanStatus, setScanStatus]         = useState<ScanStatus>("idle");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  // Company autocomplete state
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data: string[]) => setCompanySuggestions(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isEditing = !!expenseId;
  const isIncome  = entryType === "income";

  const filteredCompanies = form.company.trim()
    ? companySuggestions.filter((c) => c.toLowerCase().includes(form.company.toLowerCase()))
    : companySuggestions;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.amount || !form.date) { setError("Bitte fülle alle Pflichtfelder aus."); return; }
    if (Number(form.amount) <= 0)   { setError("Betrag muss größer als 0 sein."); return; }
    if (!isIncome && !form.category) { setError("Bitte wähle eine Kategorie aus."); return; }
    if (accounts.length > 0 && accountId === null) { setError("Bitte wähle ein Konto aus."); return; }

    setLoading(true);
    try {
      const url    = isEditing ? `/api/expenses/${expenseId}` : "/api/expenses";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:     Number(form.amount),
          category:   form.category || "",
          date:       form.date,
          note:       form.note || null,
          company:    form.company || null,
          type:       entryType,
          account_id: accountId,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Fehler"); }
      setSuccess(true);
      if (onSuccess) { onSuccess(); }
      else { setTimeout(() => { router.push("/"); router.refresh(); }, 900); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function handleReceiptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptPreview(URL.createObjectURL(file));
    setScanStatus("scanning");
    try {
      const body = new FormData();
      body.append("image", file);
      const res  = await fetch("/api/receipt-scan", { method: "POST", body });
      if (!res.ok) throw new Error();
      const data = await res.json() as { amount: number | null; company: string | null };
      if (data.amount !== null) setForm((f) => ({ ...f, amount: String(data.amount) }));
      if (data.company)         setForm((f) => ({ ...f, company: data.company! }));
      setScanStatus("done");
    } catch {
      setScanStatus("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearReceipt() {
    setReceiptPreview(null);
    setScanStatus("idle");
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 sm:p-6 space-y-6 animate-fade-up">

      {/* Type toggle */}
      {!isEditing && (
        <div className="flex rounded-lg overflow-hidden border border-stone-800 p-0.5 gap-0.5">
          {(["expense", "income"] as EntryType[]).map((t) => {
            const active = entryType === t;
            return (
              <button
                key={t} type="button"
                onClick={() => { setEntryType(t); setForm((f) => ({ ...f, category: "" })); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[13px] font-medium transition-all duration-200",
                  active
                    ? t === "expense"
                      ? "bg-red-950/60 border border-red-900/50 text-red-300"
                      : "bg-emerald-950/60 border border-emerald-900/50 text-emerald-300"
                    : "text-stone-600 hover:text-stone-400"
                )}
              >
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
        <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-3">Betrag</label>
        <div className="relative">
          <input
            type="number" step="0.01" min="0.01" placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className={cn(
              "w-full bg-transparent border-0 border-b-2 pb-2 pr-10",
              "font-display text-5xl text-stone-100 leading-none placeholder:text-stone-700",
              "focus:outline-none transition-colors duration-200",
              isIncome ? "border-emerald-800 focus:border-emerald-500/60" : "border-stone-800 focus:border-amber-500/60"
            )}
          />
          <span className="absolute right-0 bottom-3 font-display text-2xl text-stone-600">€</span>
        </div>

        {/* Versteckter File-Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleReceiptFile}
        />

        {/* Kamera-Button / Scan-Status */}
        <div className="mt-3 flex items-center gap-3">
          {receiptPreview ? (
            <>
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={receiptPreview} alt="Kassenbon"
                  className="w-12 h-12 object-cover rounded-md border border-stone-800" />
                {scanStatus !== "scanning" && (
                  <button type="button" onClick={clearReceipt}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-700 flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-stone-300" />
                  </button>
                )}
              </div>
              {scanStatus === "scanning" && (
                <span className="flex items-center gap-1.5 text-[12px] text-stone-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Bon wird gescannt…
                </span>
              )}
              {scanStatus === "done" && (
                <span className="flex items-center gap-1.5 text-[12px] text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Betrag erkannt
                </span>
              )}
              {scanStatus === "error" && (
                <span className="text-[12px] text-red-400">
                  Erkennung fehlgeschlagen – bitte manuell eingeben
                </span>
              )}
            </>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={scanStatus === "scanning"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-400 transition-colors tap-target">
              <Camera className="w-3.5 h-3.5" /> Kassenbon scannen
            </button>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Category — only for expenses */}
      {!isIncome && (
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-3">Kategorie</label>
          {catsLoading ? (
            <div className="flex items-center gap-2 text-stone-600 text-sm py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Lade…
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const selected = form.category === cat.id;
                return (
                  <button
                    key={cat.id} type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-medium",
                      "transition-all duration-200 relative overflow-hidden tap-target",
                      selected ? "border-current" : "border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-400"
                    )}
                    style={selected ? { color: cat.color, borderColor: `${cat.color}60`, backgroundColor: `${cat.color}0d` } : {}}
                  >
                    <span className="text-xl leading-none">{cat.icon}</span>
                    <span className="tracking-wide">{cat.label}</span>
                    {selected && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: cat.color, opacity: 0.6 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Income source note — shown for income */}
      {isIncome && (
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-3">
            Quelle <span className="normal-case text-stone-700 tracking-normal">(optional)</span>
          </label>
          <input
            type="text" placeholder="z.B. Gehalt, Freelance, Zinsen…"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            maxLength={200}
            className="field-input text-[13px]"
          />
        </div>
      )}

      {/* Account selector — only shown when accounts exist */}
      {accounts.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-3">
              Konto
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {accounts.map((acc) => {
                const selected = accountId === acc.id;
                const balance  = acc.tracked_balance;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] transition-all duration-200 tap-target"
                    )}
                    style={
                      selected
                        ? { borderColor: `${acc.color}60`, backgroundColor: `${acc.color}10`, color: acc.color }
                        : { borderColor: "#292524", color: "#78716c" }
                    }
                  >
                    <span>{acc.icon}</span>
                    <span className="whitespace-nowrap">{acc.name}</span>
                    <span className={cn(
                      "font-numbers text-[10px] opacity-70",
                      balance >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {balance < 0 ? "−" : ""}{Math.abs(balance).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="divider" />

      {/* Date + Note */}
      <div className={cn("grid gap-4", isIncome ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-3">Datum</label>
          <input type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="field-input text-[13px] [color-scheme:dark]" />
        </div>
        {!isIncome && (
          <div>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-3">
              Notiz <span className="normal-case text-stone-700 tracking-normal">(optional)</span>
            </label>
            <input type="text" placeholder="z.B. Einkauf Rewe…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              maxLength={200}
              className="field-input text-[13px]" />
          </div>
        )}
      </div>

      {/* Company autocomplete */}
      <div ref={companyRef} className="relative">
        <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-3">
          Firma <span className="normal-case text-stone-700 tracking-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="z.B. Rewe, Amazon, …"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          onFocus={() => setShowSuggestions(true)}
          autoComplete="off"
          maxLength={200}
          className="field-input text-[13px] w-full"
        />
        {showSuggestions && filteredCompanies.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-stone-800 bg-stone-950 shadow-xl overflow-hidden">
            {filteredCompanies.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setForm({ ...form, company: c });
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] text-stone-300 hover:bg-stone-800 transition-colors"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3">
          <p className="text-red-400 text-[13px]">{error}</p>
        </div>
      )}

      <button type="submit" disabled={loading || success}
        className={cn(
          "w-full py-3 px-5 rounded-lg text-[13px] tracking-wide font-medium border",
          "flex items-center justify-center gap-2 transition-all duration-300",
          success
            ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
            : loading
            ? "bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed"
            : isIncome
            ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/60"
            : "bg-amber-950/40 border-amber-800/40 text-amber-400 hover:bg-amber-950/60 hover:border-amber-700/50"
        )}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichern…</>
          : success ? <><CheckCircle2 className="w-4 h-4" /> Gespeichert</>
          : isEditing ? "Änderungen speichern"
          : isIncome ? "Einnahme erfassen"
          : "Ausgabe erfassen"}
      </button>
    </form>
  );
}
