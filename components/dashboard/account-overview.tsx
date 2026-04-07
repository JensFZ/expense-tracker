"use client";

import Link from "next/link";
import { Landmark, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import type { AccountWithBalance } from "@/lib/db";

const TYPE_LABELS: Record<string, string> = {
  checking: "Girokonto",
  credit:   "Kreditkarte",
  cash:     "Bargeld",
  loan:     "Kredit",
};

const TYPE_ORDER = ["checking", "credit", "cash", "loan"];

interface AccountOverviewProps {
  accounts: AccountWithBalance[];
}

export function AccountOverview({ accounts }: AccountOverviewProps) {
  if (accounts.length === 0) return null;

  const netWorth = accounts.reduce((sum, a) => sum + a.tracked_balance, 0);
  const netPositive = netWorth >= 0;

  // Sort by type order, then by name
  const sorted = [...accounts].sort((a, b) => {
    const orderDiff = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="glass-card overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-900/40 flex items-center justify-center flex-shrink-0">
            <Landmark className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-0.5">Konten</p>
            <p className="text-[13px] text-stone-400">
              {accounts.length} Konto{accounts.length !== 1 ? "en" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`font-numbers text-[1.25rem] leading-none ${netPositive ? "text-emerald-300" : "text-red-400"}`}>
              {netWorth < 0 ? "−" : ""}{Math.abs(netWorth).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {" "}<span className="text-sm opacity-50">€</span>
            </p>
            <p className="text-[10px] text-stone-700 mt-0.5">Nettovermögen</p>
          </div>
          <Link
            href="/accounts"
            className="text-[12px] text-amber-500/70 hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            Verwalten <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="divider mx-5" />

      {/* Account rows */}
      <div className="divide-y divide-stone-900/60">
        {sorted.map((account) => {
          const positive = account.tracked_balance >= 0;
          return (
            <div key={account.id} className="px-5 py-3 flex items-center gap-3">

              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{
                  backgroundColor: `${account.color}15`,
                  border: `1px solid ${account.color}25`,
                }}
              >
                {account.icon}
              </div>

              {/* Name + type */}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-stone-300 truncate leading-tight">{account.name}</p>
                <p className="text-[10px] text-stone-600 mt-0.5">{TYPE_LABELS[account.type] ?? account.type}</p>
              </div>

              {/* Balance */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                {positive
                  ? <TrendingUp className="w-3 h-3 text-emerald-600" />
                  : <TrendingDown className="w-3 h-3 text-red-500" />
                }
                <span className={`font-numbers text-[0.9rem] ${positive ? "text-emerald-300" : "text-red-400"}`}>
                  {account.tracked_balance < 0 ? "−" : ""}
                  {Math.abs(account.tracked_balance).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} €
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="divider mx-5" />
      <div className="px-5 py-3 flex items-center justify-between">
        <p className="text-[11px] text-stone-700">
          {accounts.filter(a => a.type === "loan").length > 0 && (
            <>Inkl. Kredite</>
          )}
          {accounts.filter(a => a.type === "loan").length === 0 && (
            <>Alle Konten</>
          )}
        </p>
        <Link
          href="/accounts"
          className="flex items-center gap-1 text-[12px] text-sky-400/70 hover:text-sky-300 transition-colors"
        >
          Abgleichen →
        </Link>
      </div>

    </div>
  );
}
