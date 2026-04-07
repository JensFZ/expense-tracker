"use client";

import { Category } from "@/lib/categories";
import Link from "next/link";
import { PiggyBank, Plus } from "lucide-react";

interface SavingsOverviewProps {
  categories: Category[];
  totalByCategory: Record<string, number>;
  thisMonthByCategory: Record<string, number>;
}

export function SavingsOverview({ categories, totalByCategory, thisMonthByCategory }: SavingsOverviewProps) {
  const withSavings = categories.filter(
    (c) => c.monthly_savings !== null && c.monthly_savings > 0
  );

  if (withSavings.length === 0) return null;

  const grandTotal       = withSavings.reduce((s, c) => s + (totalByCategory[c.id] ?? 0), 0);
  const totalMonthlyGoal = withSavings.reduce((s, c) => s + c.monthly_savings!, 0);
  const totalThisMonth   = withSavings.reduce((s, c) => s + (thisMonthByCategory[c.id] ?? 0), 0);
  const overallPct       = totalMonthlyGoal > 0 ? Math.min((totalThisMonth / totalMonthlyGoal) * 100, 100) : 0;

  return (
    <div className="glass-card animate-fade-up overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-950/60 border border-violet-900/40 flex items-center justify-center flex-shrink-0">
            <PiggyBank className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-0.5">Rücklagen</p>
            <p className="text-[13px] text-stone-400">
              {withSavings.length} Sparziel{withSavings.length !== 1 ? "e" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-numbers text-[1.25rem] text-violet-300 leading-none">
              {grandTotal.toFixed(2)} <span className="text-sm text-violet-400/50">€</span>
            </p>
            <p className="text-[10px] text-stone-700 mt-0.5">gesamt angespart</p>
          </div>
          <Link href="/settings" className="text-[12px] text-amber-500/70 hover:text-amber-400 transition-colors">
            Verwalten →
          </Link>
        </div>
      </div>

      {/* Overall month progress */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-[0.1em] text-stone-700">Monatsfortschritt</span>
          <span className="font-numbers text-[11px] text-stone-600">
            <span className="text-stone-400">{totalThisMonth.toFixed(0)} €</span>
            {" "}/ {totalMonthlyGoal.toFixed(0)} € Ziel
          </span>
        </div>
        <div className="h-1 rounded-full bg-stone-800/80 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", opacity: 0.8 }} />
        </div>
      </div>

      <div className="divider mx-5" />

      {/* Per-category rows */}
      <div className="divide-y divide-stone-900/60">
        {withSavings.map((cat) => {
          const total     = totalByCategory[cat.id] ?? 0;
          const thisMonth = thisMonthByCategory[cat.id] ?? 0;
          const goal      = cat.monthly_savings!;
          const monthPct  = Math.min((thisMonth / goal) * 100, 100);
          const monthDone = thisMonth >= goal;

          return (
            <div key={cat.id} className="px-5 py-4 flex items-center gap-4">

              {/* Left: icon + name + bar */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}20` }}>
                  {cat.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13px] text-stone-300 truncate">{cat.label}</span>
                    {monthDone && (
                      <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}30` }}>
                        ✓ Erreicht
                      </span>
                    )}
                  </div>

                  {/* Month bar */}
                  <div className="h-1.5 rounded-full bg-stone-800/80 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${monthPct}%`, backgroundColor: monthDone ? cat.color : "#7c3aed", opacity: 0.75 }} />
                  </div>

                  <p className="text-[11px] text-stone-600 mt-1.5">
                    <span className="font-numbers" style={{ color: monthDone ? `${cat.color}cc` : "#78716c" }}>
                      {thisMonth.toFixed(2)} €
                    </span>
                    {" "}<span className="text-stone-800">/</span>{" "}
                    <span className="font-numbers text-stone-600">{goal.toFixed(2)} €/Mo.</span>
                  </p>
                </div>
              </div>

              {/* Right: total balance */}
              <div className="flex-shrink-0 text-right w-16">
                <p className="font-numbers text-[1.25rem] leading-none text-violet-300">
                  {total.toFixed(0)}
                  <span className="text-xs ml-0.5 text-violet-400/50">€</span>
                </p>
                <p className="text-[10px] text-stone-700 mt-0.5">gespart</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="divider mx-5" />
      <div className="px-5 py-3 flex items-center justify-between">
        <p className="text-[11px] text-stone-700">
          Monatsziel: <span className="font-numbers text-stone-600">{totalMonthlyGoal.toFixed(2)} €</span>
        </p>
        <Link href="/add"
          className="flex items-center gap-1 text-[12px] text-violet-400/70 hover:text-violet-300 transition-colors">
          <Plus className="w-3 h-3" /> Einzahlen
        </Link>
      </div>
    </div>
  );
}
