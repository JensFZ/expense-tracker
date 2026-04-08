export const dynamic = "force-dynamic";

import { ExpensesTable } from "@/components/expenses/expenses-table";

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 mb-1.5">
            Ausgabenverwaltung
          </p>
          <h1 className="font-display text-3xl text-stone-100">
            Alle Einträge
          </h1>
        </div>
      </div>
      <div className="divider" />
      <ExpensesTable />
    </div>
  );
}
