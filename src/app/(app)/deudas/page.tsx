import { Package, Wallet } from "lucide-react";
import { addDebtCharge, deleteDebtEntry, reportBlock, saveTarifa } from "@/app/actions";
import { DebtReview } from "@/components/ReviewButtons";
import { ActButton, ActionForm, SubmitButton, Toggle } from "@/components/forms";
import { Avatar, Card, Empty, IconTitle, PageTitle, ReviewBadge } from "@/components/ui";
import { debtBalance, displayName, getDebtEntries, getSession, getTarifaBloque, money } from "@/lib/data";
import { formatDate, formatShort, todayMX } from "@/lib/dates";

export default async function DeudasPage() {
  const { me, isAdmin, hijas, byId } = await getSession();
  const [entries, tarifa] = await Promise.all([getDebtEntries(), getTarifaBloque()]);
  const visible = isAdmin ? entries : entries.filter((e) => e.hija === me.id);

  return (
    <div className="space-y-4">
      <PageTitle sub="Lo que se debe y lo que se va abonando" icon={Wallet} tone="green">Deudas</PageTitle>

      <div className="grid grid-cols-3 gap-2">
        {hijas.map((h) => {
          const pend = entries.filter((e) => e.hija === h.id && e.status === "pendiente" && e.kind === "abono").length;
          return (
            <div key={h.id} className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-100">
              <Avatar p={h} size={32} />
              <p className="mt-1 text-sm font-bold">{displayName(h)}</p>
              <p className="text-lg font-extrabold">{money(debtBalance(entries, h.id))}</p>
              {pend > 0 && <p className="text-xs font-semibold text-violet-700">{pend} abono{pend > 1 ? "s" : ""} por revisar</p>}
            </div>
          );
        })}
      </div>

      {!isAdmin && (
        <Card title={<IconTitle icon={Package} className="text-emerald-600">Trabajé un bloque</IconTitle>}>
          <ActionForm action={reportBlock}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">¿Qué día?</label>
                <input type="date" name="work_date" defaultValue={todayMX()} className="input" />
              </div>
              <div>
                <label className="label">Monto</label>
                <input type="number" name="amount" step="0.01" min="0" defaultValue={tarifa || ""} className="input" />
              </div>
            </div>
            <input name="concept" className="input" placeholder="Bloque de Amazon (opcional: horario, nota)" />
            <SubmitButton className="btn-primary w-full">Enviar para revisión</SubmitButton>
          </ActionForm>
        </Card>
      )}

      {isAdmin && (
        <Card title="Registrar">
          <ActionForm action={addDebtCharge}>
            <div className="grid grid-cols-2 gap-2">
              <select name="hija" className="input">
                {hijas.map((h) => (
                  <option key={h.id} value={h.id}>{displayName(h)}</option>
                ))}
              </select>
              <select name="kind" className="input">
                <option value="cargo">Debe (cargo)</option>
                <option value="abono">Abonó (pago)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="amount" type="number" step="0.01" min="0" placeholder="Monto" className="input" />
              <input name="work_date" type="date" defaultValue={todayMX()} className="input" />
            </div>
            <input name="concept" className="input" placeholder="Ej. Salida al cine" />
            <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
          </ActionForm>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Toggle label={`Tarifa por bloque: ${money(tarifa)}`} className="text-sm font-bold text-brand-700">
              <ActionForm action={saveTarifa} className="flex gap-2" resetOnOk={false}>
                <input name="tarifa" type="number" step="0.01" min="0" defaultValue={tarifa} className="input" />
                <SubmitButton className="btn-soft">Guardar</SubmitButton>
              </ActionForm>
            </Toggle>
          </div>
        </Card>
      )}

      <Card title="Movimientos">
        {visible.length === 0 ? (
          <Empty>Sin movimientos.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-start gap-2">
                  <Avatar p={byId.get(e.hija)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold">
                        {displayName(byId.get(e.hija))}{" "}
                        <span className={e.kind === "cargo" ? "text-rose-600" : "text-emerald-600"}>
                          {e.kind === "cargo" ? "+" : "−"}
                          {money(Number(e.amount))}
                        </span>
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
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
