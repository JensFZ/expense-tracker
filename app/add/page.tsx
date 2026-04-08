export const dynamic = "force-dynamic";

import { AddExpenseForm } from "@/components/expenses/add-expense-form";

export default function AddPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500 mb-1.5">
          Neue Ausgabe
        </p>
        <h1 className="font-display text-3xl text-stone-100">
          Erfassen
        </h1>
      </div>
      <div className="divider" />
      <AddExpenseForm />
    </div>
  );
}
