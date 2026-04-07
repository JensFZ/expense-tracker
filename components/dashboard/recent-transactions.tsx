"use client";

import { Expense } from "@/lib/db";
import { Category, resolveCategory } from "@/lib/categories";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface RecentTransactionsProps {
  expenses: Expense[];
  income: Expense[];
  categories: Category[];
}

function formatDateHeader(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return "Heute";
  if (isYesterday(d)) return "Gestern";
  return format(d, "EEEE, d. MMMM", { locale: de });
}

export function RecentTransactions({ expenses, income, categories }: RecentTransactionsProps) {
  const all = [...expenses, ...income]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome   = income.reduce((s, e) => s + e.amount, 0);

  // Group entries by date
  const groups: { date: string; entries: typeof all }[] = [];
  for (const entry of all) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.date, entries: [entry] });
    }
  }

  return (
    <div className="glass-card overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-0.5">
            Letzte Transaktionen
          </p>
          <p className="text-[13px] text-stone-400">Aktueller Monat</p>
        </div>
        <Link href="/expenses" className="text-[12px] text-amber-500/70 hover:text-amber-400 transition-colors">
          Alle →
        </Link>
      </div>

      <div className="divider mx-5" />

      {all.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-stone-600 text-sm mb-2">Noch keine Einträge</p>
          <Link href="/add" className="text-amber-500/80 text-[13px] hover:text-amber-400 transition-colors">
            Erste Ausgabe erfassen →
          </Link>
        </div>
      ) : (
        <>
          <div className="pb-1">
            {groups.map((group, gi) => (
              <div key={group.date}>
                {/* Date header row */}
                <div className={`flex items-center gap-3 px-5 ${gi === 0 ? "pt-4" : "pt-5"} pb-2`}>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-stone-600">
                    {formatDateHeader(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-stone-900" />
                  <span className="font-numbers text-[10px] text-stone-700">
                    {format(parseISO(group.date), "d. MMM", { locale: de })}
                  </span>
                </div>

                {/* Entries for this date */}
                <div className="px-5">
                  {group.entries.map((entry, i) => {
                    const isIncome = entry.type === "income";
                    const cat = isIncome ? null : resolveCategory(categories, entry.category);

                    return (
                      <div key={`${entry.type}-${entry.id}`}
                        className="flex items-center gap-3 py-2.5 animate-fade-up"
                        style={{ animationDelay: `${(gi * 4 + i) * 30}ms` }}>

                        {/* Icon */}
                        <div className="relative flex-shrink-0">
                          {isIncome ? (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-950/60 border border-emerald-900/40">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${cat!.color}16` }}>
                                <span className="text-sm leading-none">{cat!.icon}</span>
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0905]"
                                style={{ backgroundColor: cat!.color }} />
                            </>
                          )}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-stone-300 truncate leading-tight">
                            {entry.note || (isIncome ? "Einnahme" : cat!.label)}
                          </p>
                          <p className="text-[11px] text-stone-600 mt-0.5 tracking-wide">
                            {isIncome ? "Einnahme" : cat!.label}
                          </p>
                        </div>

                        {/* Amount */}
                        <span className={`font-numbers text-[14px] tabular-nums flex-shrink-0 ${
                          isIncome ? "text-emerald-400" : "text-stone-300"
                        }`}>
                          {isIncome ? "+" : "−"}{entry.amount.toFixed(2)} €
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer totals */}
          <div className="divider mx-5 mt-3" />
          <div className="grid grid-cols-3 divide-x divide-stone-900 py-3.5">
            <div className="px-5">
              <p className="text-[9px] uppercase tracking-[0.1em] text-stone-700 mb-1">Ausgaben</p>
              <p className="font-numbers text-[13px] text-red-400/80">{totalExpenses.toFixed(2)} €</p>
            </div>
            <div className="px-5">
              <p className="text-[9px] uppercase tracking-[0.1em] text-stone-700 mb-1">Einnahmen</p>
              <p className="font-numbers text-[13px] text-emerald-400/80">{totalIncome.toFixed(2)} €</p>
            </div>
            <div className="px-5">
              <p className="text-[9px] uppercase tracking-[0.1em] text-stone-700 mb-1">Bilanz</p>
              <p className={`font-numbers text-[13px] ${
                totalIncome - totalExpenses >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {totalIncome - totalExpenses >= 0 ? "+" : ""}{(totalIncome - totalExpenses).toFixed(2)} €
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
