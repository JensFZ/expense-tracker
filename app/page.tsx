export const dynamic = "force-dynamic";

import {
  getExpensesLast6Months,
  getAllCategories,
  getSavingsTotalByCategory,
  getAccountBalances,
  generateDueEntries,
} from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  generateDueEntries();

  const [monthlyData, categories, savingsTotal, accounts] = await Promise.resolve([
    getExpensesLast6Months(),
    getAllCategories(),
    getSavingsTotalByCategory(),
    getAccountBalances(),
  ]);

  return (
    <DashboardClient
      monthlyData={monthlyData}
      categories={categories}
      savingsTotal={savingsTotal}
      accounts={accounts}
    />
  );
}
