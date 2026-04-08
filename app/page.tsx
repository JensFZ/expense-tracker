export const dynamic = "force-dynamic";

import {
  getExpensesThisMonth,
  getIncomeThisMonth,
  getExpensesLast6Months,
  getAllCategories,
  getSavingsTotalByCategory,
  getSavingsThisMonthByCategory,
  getAccountBalances,
  generateDueEntries,
} from "@/lib/db";
import { StatsCards }       from "@/components/dashboard/stats-cards";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { MonthlyBarChart }  from "@/components/dashboard/monthly-bar-chart";
import { BudgetLimits }     from "@/components/dashboard/budget-limits";
import { SavingsOverview }  from "@/components/dashboard/savings-overview";
import { AccountOverview }  from "@/components/dashboard/account-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default async function DashboardPage() {
  generateDueEntries();

  const [
    monthExpenses,
    monthIncome,
    monthlyData,
    categories,
    savingsTotal,
    savingsThisMonth,
    accounts,
  ] = await Promise.resolve([
    getExpensesThisMonth(),
    getIncomeThisMonth(),
    getExpensesLast6Months(),
    getAllCategories(),
    getSavingsTotalByCategory(),
    getSavingsThisMonthByCategory(),
    getAccountBalances(),
  ]);

  const now = new Date();
  const monthName = now.toLocaleDateString("de-DE", { month: "long" });
  const year = now.getFullYear();

  const hasLimits   = categories.some((c) => c.monthly_limit   !== null && c.monthly_limit   > 0);
  const hasSavings  = categories.some((c) => c.monthly_savings !== null && c.monthly_savings > 0);
  const hasAccounts = accounts.length > 0;

  return (
    <div className="space-y-7">

      <div className="animate-fade-up flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-600 mb-2">Finanzbericht</p>
          <h1 className="font-display text-3xl sm:text-4xl text-stone-100 leading-tight">
            {monthName}
            <span className="text-stone-600 ml-2 font-normal not-italic">{year}</span>
          </h1>
        </div>
        <div className="text-right pb-1">
          <p className="font-numbers text-[1.5rem] leading-none text-stone-500">
            {monthExpenses.length + monthIncome.length}
          </p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-stone-700 mt-0.5">Einträge</p>
        </div>
      </div>

      <div className="divider" />

      <div style={{ animationDelay: "50ms" }} className="animate-fade-up">
        <StatsCards expenses={monthExpenses} income={monthIncome} categories={categories} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "130ms" }}>
        <CategoryPieChart expenses={monthExpenses} categories={categories} />
        <MonthlyBarChart  data={monthlyData}       categories={categories} />
      </div>

      {hasLimits && (
        <div className="animate-fade-up" style={{ animationDelay: "190ms" }}>
          <BudgetLimits expenses={monthExpenses} categories={categories} />
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
        <RecentTransactions expenses={monthExpenses} income={monthIncome} categories={categories} />
      </div>

    </div>
  );
}
