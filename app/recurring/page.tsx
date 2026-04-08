export const dynamic = "force-dynamic";

import { getAllRecurring, getAllCategories, generateDueEntries } from "@/lib/db";
import { RecurringManager } from "@/components/recurring/recurring-manager";

export default async function RecurringPage() {
  // Generate any due entries before rendering
  generateDueEntries();

  const [entries, categories] = [getAllRecurring(), getAllCategories()];

  return (
    <div className="max-w-2xl mx-auto space-y-7">
      <div className="animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.12em] text-stone-600 mb-2">Automatisierung</p>
        <h1 className="font-display text-3xl sm:text-4xl text-stone-100 leading-tight">
          Daueraufträge
        </h1>
        <p className="text-stone-500 text-[13px] mt-2">
          Wiederkehrende Einnahmen und Ausgaben werden automatisch zum Fälligkeitsdatum eingetragen.
        </p>
      </div>

      <div className="divider" />

      <RecurringManager initialEntries={entries} categories={categories} />
    </div>
  );
}
