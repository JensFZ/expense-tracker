"use client";

import { Expense } from "@/lib/db";
import { Category, resolveCategory } from "@/lib/categories";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface StatsCardsProps {
  expenses: Expense[];
  income: Expense[];
  categories: Category[];
}

export function StatsCards({ expenses, income, categories }: StatsCardsProps) {
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome   = income.reduce((s, e) => s + e.amount, 0);
  const balance       = totalIncome - totalExpenses;
  const balancePos    = balance >= 0;

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topEntry   = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
  const topCat     = topEntry ? resolveCategory(categories, topEntry[0]) : null;
  const activeCats = Object.keys(byCategory).length;

  const avgPerDay = (() => {
    const d = new Date().getDate();
    return d > 0 ? totalExpenses / d : 0;
  })();

  const savingsRate = totalIncome > 0
    ? Math.max(0, Math.round((balance / totalIncome) * 100))
    : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">

      {/* ── Ausgaben ── */}
      <div className="stat-card animate-fade-up group relative overflow-hidden">
        <div className="stat-card-accent" style={{ background: "linear-gradient(90deg, #f87171, #ef4444)" }} />
        <div className="flex items-start justify-between mb-5">
          <p className="stat-label">Ausgaben</p>
          <div className="stat-icon-wrap" style={{ backgroundColor: "#f8717114" }}>
            <TrendingDown className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
          </div>
        </div>
        <p className="font-display text-[2.15rem] text-stone-100 leading-none">
          {totalExpenses.toFixed(2)}
          <span className="text-lg text-stone-500 ml-1.5">€</span>
        </p>
        <div className="stat-divider" />
        <p className="stat-meta">
          <span className="text-stone-400">{expenses.length}</span> Einträge
          <span className="mx-1.5 text-stone-800">·</span>
          Ø <span className="font-numbers text-stone-400">{avgPerDay.toFixed(2)} €</span>/Tag
        </p>
      </div>

      {/* ── Einnahmen ── */}
      <div className="stat-card animate-fade-up group relative overflow-hidden">
        <div className="stat-card-accent" style={{ background: "linear-gradient(90deg, #4ade80, #22c55e)" }} />
        <div className="flex items-start justify-between mb-5">
          <p className="stat-label">Einnahmen</p>
          <div className="stat-icon-wrap" style={{ backgroundColor: "#4ade8014" }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
          </div>
        </div>
        <p className="font-display text-[2.15rem] text-stone-100 leading-none">
          {totalIncome.toFixed(2)}
          <span className="text-lg text-stone-500 ml-1.5">€</span>
        </p>
        <div className="stat-divider" />
        <p className="stat-meta">
          {income.length > 0
            ? <><span className="text-stone-400">{income.length}</span> Einträge erfasst</>
            : <span className="text-stone-700 italic">Noch keine erfasst</span>}
        </p>
      </div>

      {/* ── Bilanz ── */}
      <div className="stat-card animate-fade-up group relative overflow-hidden">
        <div className="stat-card-accent" style={{
          background: balance === 0
            ? "rgba(245,240,232,0.08)"
            : balancePos
            ? "linear-gradient(90deg, #4ade80, #22c55e)"
            : "linear-gradient(90deg, #f87171, #ef4444)"
        }} />
        <div className="flex items-start justify-between mb-5">
          <p className="stat-label">Bilanz</p>
          <div className="stat-icon-wrap" style={{
            backgroundColor: balance === 0 ? "rgba(245,240,232,0.06)" : balancePos ? "#4ade8014" : "#f8717114"
          }}>
            {balance === 0
              ? <Minus className="w-3.5 h-3.5 text-stone-600" />
              : balancePos
              ? <TrendingUp className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
              : <TrendingDown className="w-3.5 h-3.5" style={{ color: "#f87171" }} />}
          </div>
        </div>
        <p className={`font-display text-[2.15rem] leading-none ${
          balance === 0 ? "text-stone-500" : balancePos ? "text-emerald-400" : "text-red-400"
        }`}>
          {balancePos && totalIncome > 0 ? "+" : ""}{balance.toFixed(2)}
          <span className="text-lg ml-1.5 opacity-60">€</span>
        </p>
        <div className="stat-divider" />
        <p className="stat-meta">
          {totalIncome === 0
            ? <span className="text-stone-700 italic">Keine Einnahmen</span>
            : balancePos
            ? savingsRate !== null && savingsRate > 0
              ? <><span className="font-numbers text-emerald-400/80">{savingsRate}%</span> gespart</>
              : "Ausgeglichen"
            : <span style={{ color: "#f87171a0" }}>Im Minus</span>}
        </p>
      </div>

      {/* ── Top Kategorie ── */}
      <div className="stat-card animate-fade-up group relative overflow-hidden">
        <div className="stat-card-accent" style={{
          background: topCat
            ? `linear-gradient(90deg, ${topCat.color}, ${topCat.color}aa)`
            : "rgba(245,240,232,0.05)"
        }} />
        <div className="flex items-start justify-between mb-5">
          <p className="stat-label">Top · <span className="text-stone-600">{activeCats}/{categories.length}</span></p>
          {topCat && (
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm leading-none"
              style={{ backgroundColor: `${topCat.color}15` }}>
              {topCat.icon}
            </div>
          )}
        </div>

        {topCat ? (
          <>
            <p className="font-display text-[2.15rem] text-stone-100 leading-none truncate">
              {topCat.label}
            </p>
            <div className="stat-divider" />
            <p className="stat-meta">
              <span className="font-numbers text-stone-400">{topEntry![1].toFixed(2)} €</span>
              <span className="mx-1.5 text-stone-800">·</span>
              <span className="font-numbers" style={{ color: `${topCat.color}cc` }}>
                {totalExpenses > 0 ? ((topEntry![1] / totalExpenses) * 100).toFixed(0) : 0}%
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-[2.15rem] text-stone-700 leading-none">–</p>
            <div className="stat-divider" />
            <div className="flex gap-1 flex-wrap">
              {categories.map((cat) => (
                <div key={cat.id} className="w-2 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: byCategory[cat.id] ? cat.color : "rgba(245,240,232,0.07)" }} />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
