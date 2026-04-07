"use client";

import { Expense } from "@/lib/db";
import { Category } from "@/lib/categories";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryPieChartProps {
  expenses: Expense[];
  categories: Category[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string; icon: string } }>;
}) => {
  if (active && payload && payload.length) {
    const { name, value, payload: d } = payload[0];
    return (
      <div className="glass-card px-3.5 py-2.5 shadow-2xl" style={{ borderColor: `${d.color}40` }}>
        <p className="text-[12px] text-stone-400 mb-1">{d.icon} {name}</p>
        <p className="font-numbers text-[16px] font-medium" style={{ color: d.color }}>
          {value.toFixed(2)} €
        </p>
      </div>
    );
  }
  return null;
};

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number; percent?: number;
}) {
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent || percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-(midAngle * Math.PI) / 180);
  const y = cy + r * Math.sin(-(midAngle * Math.PI) / 180);
  return (
    <text x={x} y={y} fill="rgba(245,240,232,0.9)" textAnchor="middle"
      dominantBaseline="central" fontSize={11} fontWeight={500} letterSpacing="0.03em">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function CategoryPieChart({ expenses, categories }: CategoryPieChartProps) {
  const data = categories.map((cat) => ({
    name: cat.label,
    id: cat.id,
    value: expenses.filter((e) => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
    color: cat.color,
    icon: cat.icon,
  })).filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card p-5">
      <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-0.5">Kategorien</p>
      <p className="text-[13px] text-stone-400 mb-4">Dieser Monat</p>

      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center">
          <p className="text-stone-600 text-sm">Keine Daten</p>
        </div>
      ) : (
        <div className="flex gap-4 items-center">
          {/* Donut + center label */}
          <div className="flex-shrink-0 relative" style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={76}
                  paddingAngle={2} dataKey="value" labelLine={false} label={CustomLabel} strokeWidth={0}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.88} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-numbers text-[13px] text-stone-300 leading-tight">
                {total.toFixed(0)}
              </span>
              <span className="text-[9px] text-stone-700 uppercase tracking-widest">€ gesamt</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 min-w-0">
            {data.map((d) => (
              <div key={d.id} className="flex items-center gap-2.5">
                <div className="w-1.5 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-stone-400 truncate">{d.icon} {d.name}</span>
                    <span className="font-numbers text-[12px] flex-shrink-0 tabular-nums" style={{ color: d.color }}>
                      {((d.value / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-px rounded-full bg-stone-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color, opacity: 0.6 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
