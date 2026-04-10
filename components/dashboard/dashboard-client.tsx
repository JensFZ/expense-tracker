"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/lib/db";
import { Category } from "@/lib/categories";
import { AccountWithBalance } from "@/lib/db";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { StatsCards }         from "@/components/dashboard/stats-cards";
import { CategoryPieChart }   from "@/components/dashboard/category-pie-chart";
import { MonthlyBarChart }    from "@/components/dashboard/monthly-bar-chart";
import { BudgetLimits }       from "@/components/dashboard/budget-limits";
import { SavingsOverview }    from "@/components/dashboard/savings-overview";
import { AccountOverview }    from "@/components/dashboard/account-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

type DateMode = "month" | "range";

type MonthlyDataPoint = { month: string; total: number; category: string };

interface Props {
  monthlyData: MonthlyDataPoint[];
  categories: Category[];
  savingsTotal: Record<string, number>;
  accounts: AccountWithBalance[];
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthToRange(ym: string): { from: string; to: string } {
  const [year, month] = ym.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(lastDay).padStart(2, "0")}`,
  };
}

function stepMonth(current: string, delta: number): string {
  const [year, month] = current.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MOTTOS = [
  { text: "Geld ist nicht alles – aber ohne Geld ist alles nichts.", author: "Schopenhauer (vermutlich pleite)" },
  { text: "Spare in der Zeit, dann hast du in der Not... immer noch zu wenig.", author: "Volksweisheit, realistisch" },
  { text: "Wer den Cent nicht ehrt, ist des Euro nicht wert – und kauft trotzdem Avocado-Toast.", author: "Anonymus, gebrochen" },
  { text: "Ein Budget ist ein Plan dafür, wie du Geld ausgibst, das du noch nicht hast.", author: "Jeder Buchhalter je" },
  { text: "Die beste Geldanlage ist die, von der du deiner Partnerin nichts erzählen musst.", author: "Weisheit aus der Praxis" },
  { text: "Reichtum ist relativ. Relativ unerreichbar.", author: "Economist, anonym" },
  { text: "Wer früh spart, hat früher Angst, sein Gespartes auszugeben.", author: "Freud (fast)" },
  { text: "Online-Shopping ist wie Zauberei: Geld weg, Paket da, Freude kurz.", author: "Gen Z, ernst gemeint" },
  { text: "Finanzielle Freiheit bedeutet: Du darfst dir aussuchen, wofür du kein Geld hast.", author: "LinkedIn-Influencer" },
  { text: "Investiere in dich selbst! Hat Starbucks auch gesagt.", author: "Unbekannt, Kaffee in der Hand" },
  { text: "Heute gespart ist morgen... immer noch zu wenig für die Rente.", author: "Deutsche Rentenversicherung" },
  { text: "Der Unterschied zwischen Armut und Sparsamkeit ist das Selfie dabei.", author: "Instagram, 2019" },
  { text: "Wer nichts ausgibt, hat auch nichts erlebt – außer einem prallen Konto.", author: "Dilemma, ungelöst" },
  { text: "April, April – der macht mit deinem Kontostand was er will.", author: "Monat April" },
  { text: "Geld regiert die Welt. Und trotzdem hast du heute Döner gegessen.", author: "Unbekannt, satt" },
  { text: "Man soll aufhören zu essen, wenn es am besten schmeckt. Beim Geldausgeben auch.", author: "Konfuzius (wahrscheinlich)" },
  { text: "Luxus ist, wenn man sich nicht fragt, ob man sich etwas leisten kann – und es trotzdem nicht kauft.", author: "Vorsichtiger Sparfuchs" },
  { text: "Wer den ganzen Tag Ausgaben trackt, ist entweder sehr organisiert oder sehr erschrocken.", author: "Diese App" },
  { text: "Finanzdisziplin heißt: den zweiten Kaffee wollen, aber nur einen trinken. Meist.", author: "Barista, hoffnungsvoll" },
  { text: "Träume sind kostenlos. Der Rest leider nicht.", author: "Kasse, piept" },
  { text: "Haushaltsbuch führen ist wie Tagebuch – nur schmerzhafter.", author: "Jeder hier" },
  { text: "Geld kann man nicht essen. Aber man kann damit Sushi bestellen.", author: "Pragmatiker" },
  { text: "Die Steuer ist die eleganteste Form des Trickbetrugss.", author: "Steuerzahler, anonym" },
  { text: "Wer spart, lebt besser. Wer ausgibt, lebt jetzt.", author: "YOLO-Ökonomie" },
  { text: "Ein leeres Portemonnaie lehrt am besten, was wirklich wichtig ist: ein volles Portemonnaie.", author: "Lebensschule" },
  { text: "Ausgaben sind wie Kalorien – man unterschätzt sie immer.", author: "Ernährungsberater, zweckentfremdet" },
  { text: "Subscriptions kündigen: Die Aufgabe, die jedes Jahresende überlebt.", author: "To-Do-Liste, 3. Jahr" },
  { text: "Niemand hat Geld – alle tun nur so.", author: "Volkswirtschaft für Anfänger" },
  { text: "Wer aufhört zu sparen, fängt an zu genießen. Oder zu bereuen.", author: "Unentschieden" },
  { text: "Dein Konto ist kein Wunschzettel-Validator.", author: "Kontostand, direkt" },
];

function getDailyMotto() {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  return MOTTOS[dayOfYear % MOTTOS.length];
}

function formatMonthHeading(ym: string): { monthName: string; year: number } {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return {
    monthName: d.toLocaleDateString("de-DE", { month: "long" }),
    year,
  };
}

export function DashboardClient({ monthlyData, categories, savingsTotal, accounts }: Props) {
  const [dateMode, setDateMode]         = useState<DateMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [rangeFrom, setRangeFrom]       = useState("");
  const [rangeTo, setRangeTo]           = useState("");

  const [expenses, setExpenses]         = useState<Expense[]>([]);
  const [income, setIncome]             = useState<Expense[]>([]);
  const [savingsThisMonth, setSavingsThisMonth] = useState<Record<string, number>>({});
  const [loading, setLoading]           = useState(true);
  const [mottoOpen, setMottoOpen]       = useState(true);

  const getDateRange = useCallback((): { from: string; to: string } | null => {
    if (dateMode === "month") {
      return monthToRange(selectedMonth);
    }
    if (rangeFrom || rangeTo) {
      return { from: rangeFrom, to: rangeTo };
    }
    return null;
  }, [dateMode, selectedMonth, rangeFrom, rangeTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const range = getDateRange();
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to)   params.set("to", range.to);

      const expenseParams = new URLSearchParams(params);
      expenseParams.set("type", "expense");
      const incomeParams = new URLSearchParams(params);
      incomeParams.set("type", "income");
      const savingsParams = new URLSearchParams(params);

      const [expRes, incRes, savRes] = await Promise.all([
        fetch(`/api/expenses?${expenseParams}`),
        fetch(`/api/expenses?${incomeParams}`),
        fetch(`/api/savings?${savingsParams}`),
      ]);

      const [expData, incData, savData] = await Promise.all([
        expRes.json(),
        incRes.json(),
        savRes.json(),
      ]);

      setExpenses(expData);
      setIncome(incData);

      // Aggregate savings by category_id
      const savByCategory: Record<string, number> = {};
      for (const entry of savData) {
        savByCategory[entry.category_id] = (savByCategory[entry.category_id] ?? 0) + entry.amount;
      }
      setSavingsThisMonth(savByCategory);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasLimits   = categories.some((c) => c.monthly_limit   !== null && c.monthly_limit   > 0);
  const hasSavings  = categories.some((c) => c.monthly_savings !== null && c.monthly_savings > 0);
  const hasAccounts = accounts.length > 0;

  const { monthName, year } = dateMode === "month"
    ? formatMonthHeading(selectedMonth)
    : { monthName: "Zeitraum", year: new Date().getFullYear() };

  const headingText = dateMode === "range" && (rangeFrom || rangeTo)
    ? [rangeFrom, rangeTo].filter(Boolean).join(" – ")
    : `${monthName} ${year}`;

  const motto = getDailyMotto();

  return (
    <div className="space-y-7">

      {/* Motto des Tages */}
      <div className="glass-card animate-fade-up border-l-2 border-amber-700/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setMottoOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-amber-700/70">Motto des Tages</p>
          <ChevronDown className={cn("w-3.5 h-3.5 text-amber-700/50 transition-transform duration-200", mottoOpen && "rotate-180")} />
        </button>
        {mottoOpen && (
          <div className="px-4 pb-3">
            <p className="text-stone-300 text-[14px] leading-snug italic">&bdquo;{motto.text}&ldquo;</p>
            <p className="text-stone-600 text-[11px] mt-1.5">— {motto.author}</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="animate-fade-up flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-600 mb-2">Finanzbericht</p>
          <h1 className="font-display text-3xl sm:text-4xl text-stone-100 leading-tight">
            {dateMode === "month" ? (
              <>
                {monthName}
                <span className="text-stone-600 ml-2 font-normal not-italic">{year}</span>
              </>
            ) : (
              <span className="text-[1.8rem]">{headingText || "Zeitraum"}</span>
            )}
          </h1>
        </div>
        <div className="text-right pb-1">
          {loading ? (
            <div className="w-8 h-6 bg-stone-800 rounded animate-pulse" />
          ) : (
            <>
              <p className="font-numbers text-[1.5rem] leading-none text-stone-500">
                {expenses.length + income.length}
              </p>
              <p className="text-[10px] uppercase tracking-[0.1em] text-stone-700 mt-0.5">Einträge</p>
            </>
          )}
        </div>
      </div>

      {/* Date filter */}
      <div className="glass-card p-3 flex items-center gap-2 flex-wrap animate-fade-up">
        {/* Mode toggle */}
        <div className="flex rounded-md border border-stone-800 overflow-hidden text-[12px]">
          <button
            onClick={() => setDateMode("month")}
            className={cn(
              "px-3 py-1.5 transition-colors",
              dateMode === "month" ? "bg-stone-800 text-stone-200" : "text-stone-600 hover:text-stone-400"
            )}
          >
            Monat
          </button>
          <button
            onClick={() => setDateMode("range")}
            className={cn(
              "px-3 py-1.5 transition-colors border-l border-stone-800",
              dateMode === "range" ? "bg-stone-800 text-stone-200" : "text-stone-600 hover:text-stone-400"
            )}
          >
            Zeitraum
          </button>
        </div>

        {dateMode === "month" ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedMonth((m) => stepMonth(m, -1))}
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
              onClick={() => setSelectedMonth((m) => stepMonth(m, 1))}
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
                className="text-stone-600 hover:text-stone-400 transition-colors text-[12px] px-2"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      <div className="divider" />

      <div style={{ animationDelay: "50ms" }} className="animate-fade-up">
        <StatsCards expenses={expenses} income={income} categories={categories} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "130ms" }}>
        <CategoryPieChart expenses={expenses} categories={categories} />
        <MonthlyBarChart  data={monthlyData}  categories={categories} />
      </div>

      {hasLimits && (
        <div className="animate-fade-up" style={{ animationDelay: "190ms" }}>
          <BudgetLimits expenses={expenses} categories={categories} />
        </div>
      )}

      {hasSavings && (
        <div className="animate-fade-up" style={{ animationDelay: "230ms" }}>
          <SavingsOverview
            categories={categories}
            totalByCategory={savingsTotal}
            thisMonthByCategory={savingsThisMonth}
          />
        </div>
      )}

      {hasAccounts && (
        <div className="animate-fade-up" style={{ animationDelay: "270ms" }}>
          <AccountOverview accounts={accounts} />
        </div>
      )}

      <div className="animate-fade-up" style={{ animationDelay: "310ms" }}>
        <RecentTransactions expenses={expenses} income={income} categories={categories} />
      </div>

    </div>
  );
}
