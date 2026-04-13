"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/categories";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthlyData { month: string; total: number; category: string; }

type Period = 3 | 6 | 12;

const PERIOD_LABELS: Record<Period, string> = {
  3: "3M",
  6: "6M",
  12: "1J",
};

interface MonthlyBarChartProps {
  data: MonthlyData[];
  categories: Category[];
}

function CustomTooltip({ active, payload, label, categories }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  active?: boolean; payload?: readonly any[]; label?: string | number; categories: Category[];
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => (p.value ?? 0) > 0);
  const total = items.reduce((s: number, p: { value?: number }) => s + (p.value ?? 0), 0);
  return (
    <div className="glass-card px-3.5 py-3 shadow-2xl min-w-36">
      <p className="text-[11px] uppercase tracking-[0.08em] text-stone-500 mb-2">{label}</p>
      {items.map((p: { name?: string; value?: number; color?: string }) => {
        const cat = categories.find((c) => c.label === p.name);
        return (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-[12px] text-stone-400">{cat?.icon} {p.name}</span>
            <span className="font-numbers text-[12px]" style={{ color: p.color }}>{(p.value ?? 0).toFixed(0)} €</span>
          </div>
        );
      })}
      {items.length > 1 && (
        <>
          <div className="divider my-2" />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-stone-600">Gesamt</span>
            <span className="font-numbers text-[13px] text-amber-400">{total.toFixed(2)} €</span>
          </div>
        </>
      )}
    </div>
  );
}

export function MonthlyBarChart({ data: initialData, categories }: MonthlyBarChartProps) {
  const [period, setPeriod] = useState<Period>(6);
  const [data, setData] = useState<MonthlyData[]>(initialData);

  useEffect(() => {
    if (period === 6) {
      setData(initialData);
      return;
    }
    fetch(`/api/expenses/monthly?months=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [period, initialData]);

  const monthMap: Record<string, Record<string, number>> = {};
  data.forEach(({ month, category, total }) => {
    if (!monthMap[month]) monthMap[month] = {};
    monthMap[month][category] = (monthMap[month][category] || 0) + total;
  });

  const chartData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cats]) => {
      const row: Record<string, string | number> = {
        month: format(parseISO(`${month}-01`), "MMM", { locale: de }),
      };
      categories.forEach((cat) => { row[cat.label] = cats[cat.id] || 0; });
      return row;
    });

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-0.5">Verlauf</p>
          <p className="text-[13px] text-stone-400">
            {period === 12 ? "Letztes Jahr" : `Letzte ${period} Monate`}
          </p>
        </div>
        <div className="flex rounded border border-stone-800 overflow-hidden text-[11px]">
          {([3, 6, 12] as Period[]).map((p, i) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-2.5 py-1 transition-colors",
                i > 0 && "border-l border-stone-800",
                period === p ? "bg-stone-800 text-stone-200" : "text-stone-600 hover:text-stone-400"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center">
          <p className="text-stone-600 text-sm">Keine Daten</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <BarChart data={chartData} barCategoryGap="30%" barGap={0}>
            <CartesianGrid strokeDasharray="1 4" stroke="rgba(245,240,232,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#57534e", fontSize: 11, letterSpacing: "0.04em" }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#57534e", fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${v}€`} width={48} />
            <Tooltip content={(props) => <CustomTooltip {...props} categories={categories} />}
              cursor={{ fill: "rgba(245,240,232,0.025)" }} />
            {categories.map((cat) => (
              <Bar key={cat.id} dataKey={cat.label} fill={cat.color}
                radius={[2, 2, 0, 0]} stackId="a" opacity={0.8} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
