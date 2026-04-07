"use client";

import { Expense } from "@/lib/db";
import { Category } from "@/lib/categories";
import Link from "next/link";

interface BudgetLimitsProps {
  expenses: Expense[];
  categories: Category[];
}

export function BudgetLimits({ expenses, categories }: BudgetLimitsProps) {
  const withLimits = categories.filter(
    (c) => c.monthly_limit !== null && c.monthly_limit > 0
  );

  if (withLimits.length === 0) return null;

  const spending = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const items = withLimits.map((cat) => {
    const spent   = spending[cat.id] ?? 0;
    const limit   = cat.monthly_limit!;
    const pct     = Math.min((spent / limit) * 100, 100);
    const rawPct  = (spent / limit) * 100;
    const isOver  = spent > limit;
    const isNear  = !isOver && pct >= 80;
    return { cat, spent, limit, pct, rawPct, isOver, isNear };
  }).sort((a, b) => b.rawPct - a.rawPct); // highest usage first

  const alertCount = items.filter((i) => i.isOver || i.isNear).length;

  return (
    <div className="glass-card animate-fade-up overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-0.5">Budgetlimits</p>
          <p className="text-[13px] text-stone-400">
            {withLimits.length} Kategorie{withLimits.length !== 1 ? "n" : ""} ·{" "}
            {alertCount > 0 ? (
              <span className="text-amber-400/80">{alertCount} Hinweis{alertCount !== 1 ? "e" : ""}</span>
            ) : (
              <span className="text-stone-600">Alles im Rahmen</span>
            )}
          </p>
        </div>
        <Link href="/settings" className="text-[12px] text-amber-500/70 hover:text-amber-400 transition-colors">
          Verwalten →
        </Link>
      </div>

      <div className="divider mx-5" />

      {/* Items */}
      <div className="divide-y divide-stone-900/60">
        {items.map(({ cat, spent, limit, pct, rawPct, isOver, isNear }) => {
          const barColor  = isOver ? "#ef4444" : isNear ? "#f59e0b" : cat.color;
          const pctColor  = isOver ? "#f87171" : isNear ? "#fbbf24" : cat.color;
          const remaining = limit - spent;

          return (
            <div key={cat.id} className="px-5 py-4 flex items-center gap-4">

              {/* Left: icon + name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}20` }}>
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13px] text-stone-300 truncate">{cat.label}</span>
                    {isOver && (
                      <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-950/60 border border-red-900/40 text-red-400 flex-shrink-0">
                        Überzogen
                      </span>
                    )}
                    {isNear && !isOver && (
                      <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-900/40 text-amber-400/90 flex-shrink-0">
                        Fast voll
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-stone-800/80 overflow-hidden w-full">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: barColor, opacity: 0.9 }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-stone-600">
                      <span className="font-numbers" style={{ color: `${pctColor}cc` }}>{spent.toFixed(2)} €</span>
                      {" "}<span className="text-stone-800">/</span>{" "}
                      <span className="font-numbers text-stone-600">{limit.toFixed(2)} €</span>
                    </span>
                    <span className="text-[11px]" style={{ color: isOver ? "#f87171" : "transparent" }}>
                      {isOver
                        ? <span style={{ color: "#f8717199" }}>{Math.abs(remaining).toFixed(2)} € überzogen</span>
                        : <span className="text-stone-700">noch {remaining.toFixed(2)} € frei</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: large percentage */}
              <div className="flex-shrink-0 text-right w-14">
                <p className="font-numbers leading-none tabular-nums" style={{
                  fontSize: "1.625rem",
                  color: pctColor,
                  opacity: isOver ? 1 : 0.85,
                }}>
                  {rawPct > 999 ? "999" : rawPct.toFixed(0)}
                  <span className="text-xs ml-0.5 opacity-60">%</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-1" />
    </div>
  );
}
