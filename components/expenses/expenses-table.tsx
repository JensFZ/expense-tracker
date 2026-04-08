"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Expense } from "@/lib/db";
import { resolveCategory } from "@/lib/categories";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Search,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { AddExpenseForm } from "./add-expense-form";
import { ImportDialog } from "./import-dialog";

type DateMode = "month" | "range";

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ExpensesTable() {
  const { categories } = useCategories();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Date filter
  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth()); // "YYYY-MM"
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  function monthToRange(ym: string): { from: string; to: string } {
    const [year, month] = ym.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      from: `${ym}-01`,
      to: `${ym}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  function stepMonth(delta: number) {
    const [year, month] = selectedMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (dateMode === "month") {
        const { from, to } = monthToRange(selectedMonth);
        params.set("from", from);
        params.set("to", to);
      } else {
        if (rangeFrom) params.set("from", rangeFrom);
        if (rangeTo)   params.set("to", rangeTo);
      }
      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      setExpenses(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, category, dateMode, selectedMonth, rangeFrom, rangeTo]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const sorted = [...expenses].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    if (sortBy === "date") return mult * a.date.localeCompare(b.date);
    return mult * (a.amount - b.amount);
  });

  const total = sorted.reduce((sum, e) => sum + e.amount, 0);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  }

  function toggleSort(col: "date" | "amount") {
    if (sortBy === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(col); setSortDir("desc"); }
  }

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Filter bar */}
      <div className="glass-card p-3 flex flex-col gap-2.5">
        {/* Row 1: search + category + import */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-600" />
            <input
              type="text"
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full bg-transparent border border-stone-800 rounded-md pl-8 pr-9 py-2",
                "text-[13px] text-stone-300 placeholder:text-stone-700",
                "focus:outline-none focus:border-amber-700/50 transition-colors"
              )}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                "appearance-none bg-transparent border border-stone-800 rounded-md pl-3 pr-8 py-2",
                "text-[13px] text-stone-400 [color-scheme:dark] w-full sm:min-w-40",
                "focus:outline-none focus:border-amber-700/50 transition-colors cursor-pointer"
              )}
            >
              <option value="all">Alle Kategorien</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-600 pointer-events-none" />
          </div>

          <ImportDialog onImported={fetchExpenses} />
        </div>

        {/* Row 2: date filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded-md border border-stone-800 overflow-hidden text-[12px]">
            <button
              onClick={() => setDateMode("month")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                dateMode === "month"
                  ? "bg-stone-800 text-stone-200"
                  : "text-stone-600 hover:text-stone-400"
              )}
            >
              Monat
            </button>
            <button
              onClick={() => setDateMode("range")}
              className={cn(
                "px-3 py-1.5 transition-colors border-l border-stone-800",
                dateMode === "range"
                  ? "bg-stone-800 text-stone-200"
                  : "text-stone-600 hover:text-stone-400"
              )}
            >
              Zeitraum
            </button>
          </div>

          {dateMode === "month" ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => stepMonth(-1)}
                className="w-7 h-7 flex items-center justify-center rounded border border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={cn(
                  "bg-transparent border border-stone-800 rounded-md px-3 py-1.5",
                  "text-[13px] text-stone-300 [color-scheme:dark]",
                  "focus:outline-none focus:border-amber-700/50 transition-colors"
                )}
              />
              <button
                onClick={() => stepMonth(1)}
                className="w-7 h-7 flex items-center justify-center rounded border border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedMonth(currentYearMonth())}
                className={cn(
                  "px-2.5 py-1.5 rounded border text-[12px] transition-colors",
                  selectedMonth === currentYearMonth()
                    ? "border-stone-800 text-stone-700 cursor-default"
                    : "border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700"
                )}
              >
                Heute
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className={cn(
                  "bg-transparent border border-stone-800 rounded-md px-3 py-1.5",
                  "text-[13px] text-stone-300 [color-scheme:dark]",
                  "focus:outline-none focus:border-amber-700/50 transition-colors"
                )}
              />
              <span className="text-stone-600 text-[12px]">bis</span>
              <input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className={cn(
                  "bg-transparent border border-stone-800 rounded-md px-3 py-1.5",
                  "text-[13px] text-stone-300 [color-scheme:dark]",
                  "focus:outline-none focus:border-amber-700/50 transition-colors"
                )}
              />
              {(rangeFrom || rangeTo) && (
                <button
                  onClick={() => { setRangeFrom(""); setRangeTo(""); }}
                  className="text-stone-600 hover:text-stone-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary row */}
      {!loading && sorted.length > 0 && (
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[12px] text-stone-600">
            <span className="text-stone-400">{sorted.length}</span> Einträge
          </p>
          <p className="text-[12px] text-stone-600">
            Summe:{" "}
            <span className="font-numbers text-amber-400/90">{total.toFixed(2)} €</span>
          </p>
        </div>
      )}

      {loading ? (
        <div className="glass-card flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-amber-600/50 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-stone-600 text-sm">Keine Einträge gefunden</p>
        </div>
      ) : (
        <>
          {/* ── Mobile card list (hidden on sm+) ── */}
          <div className="sm:hidden glass-card divide-y divide-stone-900/70">
            {sorted.map((expense) => {
              const isIncome = expense.type === "income";
              const cat = isIncome ? null : resolveCategory(categories, expense.category);
              return (
                <div key={expense.id} className="flex items-center gap-3 px-4 py-3.5">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {isIncome ? (
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-950/60 border border-emerald-900/40">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                        style={{ backgroundColor: `${cat!.color}18` }}
                      >
                        {cat!.icon}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-stone-300 truncate leading-tight">
                      {expense.note || (isIncome ? "Einnahme" : cat!.label)}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {isIncome ? "Einnahme · " : `${cat!.label} · `}
                      {format(parseISO(expense.date), "d. MMM yyyy", { locale: de })}
                    </p>
                  </div>

                  {/* Amount + actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className={cn(
                      "font-numbers text-[14px] tabular-nums",
                      isIncome ? "text-emerald-400" : "text-stone-300"
                    )}>
                      {isIncome ? "+" : ""}{expense.amount.toFixed(2)} €
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-stone-300 hover:bg-stone-800/60 transition-colors tap-target"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(expense.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-stone-600 hover:text-red-400 hover:bg-red-950/40 transition-colors tap-target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table (hidden on mobile) ── */}
          <div className="hidden sm:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-900">
                  <th className="text-left text-[10px] uppercase tracking-[0.1em] text-stone-600 px-5 py-3">
                    Kategorie
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-[0.1em] text-stone-600 px-4 py-3">
                    Notiz
                  </th>
                  <th
                    className="text-left text-[10px] uppercase tracking-[0.1em] text-stone-600 px-4 py-3 cursor-pointer hover:text-stone-400 transition-colors select-none"
                    onClick={() => toggleSort("date")}
                  >
                    <span className="flex items-center gap-1">
                      Datum
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform",
                          sortBy === "date" && sortDir === "asc" ? "rotate-180" : "",
                          sortBy !== "date" ? "opacity-20" : "text-amber-500/70"
                        )}
                      />
                    </span>
                  </th>
                  <th
                    className="text-right text-[10px] uppercase tracking-[0.1em] text-stone-600 px-5 py-3 cursor-pointer hover:text-stone-400 transition-colors select-none"
                    onClick={() => toggleSort("amount")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      Betrag
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform",
                          sortBy === "amount" && sortDir === "asc" ? "rotate-180" : "",
                          sortBy !== "amount" ? "opacity-20" : "text-amber-500/70"
                        )}
                      />
                    </span>
                  </th>
                  <th className="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((expense) => {
                  const isIncome = expense.type === "income";
                  const cat = isIncome ? null : resolveCategory(categories, expense.category);
                  return (
                    <tr
                      key={expense.id}
                      className="group border-b border-stone-900/70 last:border-0 hover:bg-white/[0.015] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {isIncome ? (
                            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-emerald-950/60 border border-emerald-900/40">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                          ) : (
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-sm"
                              style={{ backgroundColor: `${cat!.color}18` }}
                            >
                              {cat!.icon}
                            </div>
                          )}
                          <span
                            className="text-[12px] font-medium hidden lg:inline"
                            style={{ color: isIncome ? "#6ee7b7cc" : `${cat!.color}cc` }}
                          >
                            {isIncome ? "Einnahme" : cat!.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-48">
                        <span className="text-[13px] text-stone-500 truncate block">
                          {expense.note || <span className="text-stone-700 italic">–</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] text-stone-500">
                          {format(parseISO(expense.date), "d. MMM yyyy", { locale: de })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={cn(
                          "font-numbers text-[14px] tabular-nums",
                          isIncome ? "text-emerald-400" : "text-stone-300"
                        )}>
                          {isIncome ? "+" : ""}{expense.amount.toFixed(2)} €
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:text-stone-300 hover:bg-stone-800/60 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit Modal — centered on desktop, bottom sheet on mobile */}
      {editingExpense && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setEditingExpense(null)}
          />
          <div className="relative w-full sm:max-w-lg animate-scale-in">
            <div className="glass-card p-5 rounded-t-2xl sm:rounded-xl">
              {/* Drag handle (mobile only) */}
              <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500">
                  Bearbeiten
                </p>
                <button
                  onClick={() => setEditingExpense(null)}
                  className="w-7 h-7 rounded-md bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <AddExpenseForm
                expenseId={editingExpense.id}
                initialData={{
                  amount: editingExpense.amount.toString(),
                  category: editingExpense.category,
                  date: editingExpense.date,
                  note: editingExpense.note ?? "",
                  type: editingExpense.type,
                  accountId: editingExpense.account_id,
                }}
                onSuccess={() => {
                  setEditingExpense(null);
                  fetchExpenses();
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirm — centered on desktop, bottom sheet on mobile */}
      {deleteConfirm !== null && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative glass-card p-6 w-full sm:max-w-sm animate-scale-in rounded-t-2xl sm:rounded-xl">
            {/* Drag handle (mobile only) */}
            <div className="sm:hidden w-10 h-1 bg-stone-700 rounded-full mx-auto mb-4" />
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-red-950/50 border border-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-500/80" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-stone-200 mb-1">
                  Eintrag löschen?
                </p>
                <p className="text-[12px] text-stone-600">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg border border-stone-800 text-stone-500 text-[13px] hover:border-stone-700 hover:text-stone-400 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deletingId !== null}
                className="flex-1 py-2.5 rounded-lg border border-red-900/50 bg-red-950/30 text-red-400 text-[13px] hover:bg-red-950/50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deletingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Löschen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
