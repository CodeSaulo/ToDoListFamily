import { Package, Plus, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { addDebtCharge, deleteDebtAccount, deleteDebtEntry, reportBlock, saveDebtAccount } from "@/app/actions";
import { DebtReview } from "@/components/ReviewButtons";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import { Card, Empty, IconTitle, PageTitle, ReviewBadge } from "@/components/ui";
import { accountBalance, displayName, getDebtAccounts, getDebtEntries, getSession, money } from "@/lib/data";
import { BLOCK_RATES, type DebtAccount } from "@/lib/types";
import { formatDate, formatShort, todayMX } from "@/lib/dates";

export default async function DeudasPage({ searchParams }: { searchParams: Promise<{ cuenta?: string }> }) {
  const { me, isAdmin, byId } = await getSession();
  const [entries, allAccounts] = await Promise.all([getDebtEntries(), getDebtAccounts()]);
  // Cada hija solo ve su propia cuenta; los papás ven todas.
  const accounts = isAdmin ? allAccounts : allAccounts.filter((a) => a.profile_id === me.id);
  const { cuenta } = await searchParams;
  const selected = accounts.find((a) => a.id === cuenta) ?? accounts[0];
  const movements = selected ? entries.filter((e) => e.account_id === selected.id) : [];
  const pendingOf = (a: DebtAccount) => entries.filter((e) => e.account_id === a.id && e.status === "pendiente").length;

  return (
    <div className="space-y-4">
      <PageTitle sub="Cada quien con su propia cuenta" icon={Wallet} tone="green">Deudas</PageTitle>

      {isAdmin && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {accounts.map((a) => {
            const pend = pendingOf(a);
            const active = a.id === selected?.id;
            return (
              <Link
                key={a.id}
                href={`/deudas?cuenta=${a.id}`}
                className={`rounded-2xl bg-white p-3 shadow-sm ring-1 transition ${active ? "ring-2 ring-emerald-500" : "ring-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <AccountDot a={a} />
                  <p className="truncate text-sm font-bold">{a.name}</p>
                </div>
                <p className="mt-1 text-lg font-extrabold">{money(accountBalance(entries, a.id))}</p>
                {pend > 0 && <p className="text-xs font-semibold text-violet-700">{pend} por revisar</p>}
              </Link>
            );
          })}
        </div>
      )}

      {!selected ? (
        <Card>
          <Empty>{isAdmin ? "Crea la primera cuenta abajo." : "Todavía no tienes cuenta de deudas."}</Empty>
        </Card>
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-3 p-4 text-white" style={{ background: selected.color }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-lg font-extrabold">
              {selected.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/85">Cuenta de {selected.name}</p>
              <p className="text-3xl font-extrabold leading-tight">{money(accountBalance(entries, selected.id))}</p>
            </div>
            {isAdmin && !selected.profile_id && (
              <ActButton
                action={deleteDebtAccount.bind(null, selected.id)}
                className="rounded-full bg-white/20 p-2 hover:bg-white/30"
                confirm={`¿Borrar la cuenta de ${selected.name} y todos sus movimientos?`}
              >
                <Trash2 size={16} />
              </ActButton>
            )}
          </div>
          <div className="p-4">
            <h2 className="mb-2 text-base font-extrabold text-slate-800">Movimientos</h2>
            {movements.length === 0 ? (
              <Empty>Sin movimientos.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {movements.map((e) => (
                  <li key={e.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-lg font-extrabold ${e.kind === "cargo" ? "text-rose-600" : "text-emerald-600"}`}>
                        {e.kind === "cargo" ? "+" : "−"}
                        {money(Number(e.amount))}
                      </p>
                      <ReviewBadge s={e.status} />
                    </div>
                    <p className="text-sm text-slate-600">
                      {e.concept}
                      {e.work_date && ` · ${formatDate(e.work_date)}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {displayName(byId.get(e.created_by))} · {formatShort(e.created_at)}
                    </p>
                    {isAdmin && e.status === "pendiente" && <DebtReview e={e} />}
                    {isAdmin && e.status !== "pendiente" && (
                      <div className="mt-1">
                        <ActButton action={deleteDebtEntry.bind(null, e.id)} className="text-xs font-semibold text-slate-400" confirm="¿Borrar este movimiento?">
                          Borrar
                        </ActButton>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {!isAdmin && selected && (
        <Card title={<IconTitle icon={Package} className="text-emerald-600">Trabajé un bloque</IconTitle>}>
          <ActionForm action={reportBlock}>
            <BlockFields />
            <SubmitButton className="btn-primary w-full">Enviar para revisión</SubmitButton>
          </ActionForm>
        </Card>
      )}

      {isAdmin && selected && (
        <Card title={`Registrar en la cuenta de ${selected.name}`}>
          <ActionForm action={addDebtCharge}>
            <input type="hidden" name="account" value={selected.id} />
            <div className="grid grid-cols-2 gap-2">
              <select name="kind" className="input">
                <option value="cargo">Debe (suma)</option>
                <option value="abono">Abonó (resta)</option>
              </select>
              <input name="amount" type="number" step="0.01" min="0" placeholder="Monto" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="concept" className="input" placeholder="Ej. Salida al cine" />
              <input name="work_date" type="date" defaultValue={todayMX()} className="input" />
            </div>
            <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
          </ActionForm>
          <details className="mt-4 border-t border-slate-100 pt-3">
            <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-emerald-700">
              <Package size={15} /> Registrar bloque de Amazon
            </summary>
            <ActionForm action={reportBlock} className="mt-3 space-y-3">
              <input type="hidden" name="account" value={selected.id} />
              <BlockFields />
              <SubmitButton className="btn-primary w-full">Registrar bloque (queda aprobado)</SubmitButton>
            </ActionForm>
          </details>
        </Card>
      )}

      {isAdmin && (
        <Card title={<IconTitle icon={Plus}>Nueva cuenta</IconTitle>}>
          <ActionForm action={saveDebtAccount} className="flex gap-2">
            <input name="name" className="input" placeholder="Ej. Mamis" />
            <input name="color" type="color" defaultValue="#0d9488" className="input !h-11 !w-14 !p-1" />
            <SubmitButton>Crear</SubmitButton>
          </ActionForm>
          <p className="mt-2 text-xs text-slate-500">Las cuentas de las niñas se crean solas.</p>
        </Card>
      )}
    </div>
  );
}

function AccountDot({ a }: { a: DebtAccount }) {
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
      style={{ background: a.color }}
    >
      {a.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Fecha y tipo de bloque; el monto es fijo según el tipo. */
function BlockFields() {
  return (
    <>
      <div>
        <label className="label">¿Qué día?</label>
        <input type="date" name="work_date" defaultValue={todayMX()} className="input" />
      </div>
      <fieldset>
        <legend className="label">¿De cuántas horas fue?</legend>
        <div className="grid grid-cols-2 gap-2">
          {([2, 3] as const).map((h, i) => (
            <label
              key={h}
              className="cursor-pointer rounded-xl border-2 border-slate-200 bg-white p-3 text-center has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input type="radio" name="block_hours" value={h} defaultChecked={i === 0} className="sr-only" />
              <p className="text-sm font-bold text-slate-600">{h === 2 ? "2 horas" : "3 horas o más"}</p>
              <p className="text-2xl font-extrabold text-emerald-700">{money(BLOCK_RATES[h])}</p>
            </label>
          ))}
        </div>
      </fieldset>
      <input name="concept" className="input" placeholder="Nota (opcional), ej. turno de la mañana" />
    </>
  );
}
