import { reviewDebtEntry, reviewDishForm } from "@/app/actions";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import type { DebtEntry, DishEntry } from "@/lib/types";

/** Aprobar o rechazar un movimiento de trastes; permite ajustar cuántas tandas. */
export function DishReview({ e }: { e: DishEntry }) {
  return (
    <ActionForm action={reviewDishForm} className="mt-2 flex flex-wrap items-center gap-2" resetOnOk={false}>
      <input type="hidden" name="id" value={e.id} />
      <label className="flex items-center gap-1 text-sm font-semibold text-slate-600">
        Tandas
        <input name="qty" type="number" min={1} defaultValue={Math.abs(e.amount)} className="input !w-16 !py-1.5" />
      </label>
      <SubmitButton className="btn-green" name="decision" value="aprobar">✓ Aprobar</SubmitButton>
      <SubmitButton className="btn-red" name="decision" value="rechazar">Rechazar</SubmitButton>
    </ActionForm>
  );
}

export function DebtReview({ e }: { e: DebtEntry }) {
  return (
    <div className="mt-2 flex gap-2">
      <ActButton action={reviewDebtEntry.bind(null, e.id, true)} className="btn-green">✓ Aprobar</ActButton>
      <ActButton action={reviewDebtEntry.bind(null, e.id, false)} className="btn-red">Rechazar</ActButton>
    </div>
  );
}
