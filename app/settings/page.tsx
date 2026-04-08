export const dynamic = "force-dynamic";

import { getMonthSpendingByCategory } from "@/lib/db";
import { CategoryManager } from "@/components/settings/category-manager";

export default async function SettingsPage() {
  const monthSpending = getMonthSpendingByCategory();

  return (
    <div className="max-w-2xl mx-auto space-y-7">
      <div className="animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 mb-1.5">
          Einstellungen
        </p>
        <h1 className="font-display text-3xl text-stone-100">Kategorien</h1>
        <p className="text-stone-500 text-[13px] mt-2">
          Verwalte deine Kategorien, passe Icons und Farben an und setze monatliche Budgetlimits.
        </p>
      </div>

      <div className="divider" />

      <CategoryManager monthSpending={monthSpending} />
    </div>
  );
}
