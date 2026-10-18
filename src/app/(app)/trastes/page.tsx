import { addDishEntry, deleteDishEntry } from "@/app/actions";
import { DishReview } from "@/components/ReviewButtons";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Card, Empty, PageTitle, ReviewBadge } from "@/components/ui";
import { dishBalance, displayName, getDishEntries, getSession } from "@/lib/data";
import { formatShort } from "@/lib/dates";
import { DISH_KIND_LABEL } from "@/lib/types";

export default async function TrastesPage() {
  const { me, isAdmin, hijas, byId } = await getSession();
  const entries = await getDishEntries();

  return (
    <div className="space-y-4">
      <PageTitle sub="El pizarrón de consecuencias">Trastes 🍽️</PageTitle>

      <div className="grid grid-cols-3 gap-2">
        {hijas.map((h) => (
          <div key={h.id} className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-100">
            <Avatar p={h} size={32} />
            <p className="mt-1 text-sm font-bold">{displayName(h)}</p>
            <p className="text-3xl font-extrabold" style={{ color: h.color }}>{dishBalance(entries, h.id)}</p>
            <p className="text-xs text-slate-400">tandas</p>
          </div>
        ))}
      </div>

      <Card title="Anotar">
        <ActionForm action={addDishEntry}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">¿Qué es?</label>
              <select name="kind" className="input">
                <option value="castigo">➕ Tanda de castigo</option>
                <option value="tarea_extra">➖ Hice tarea extra</option>
                <option value="pagada">➖ Ya lavé una tanda</option>
              </select>
            </div>
            <div>
              <label className="label">¿Cuántas?</label>
              <input name="qty" type="number" min={1} defaultValue={1} className="input" />
            </div>
          </div>
          <div>
            <label className="label">¿A quién?</label>
            <select name="hija" defaultValue={isAdmin ? hijas[0]?.id : me.id} className="input">
              {hijas.map((h) => (
                <option key={h.id} value={h.id}>{displayName(h)}{h.id === me.id ? " (yo)" : ""}</option>
              ))}
            </select>
            {!isAdmin && <p className="mt-1 text-xs text-slate-500">Los descuentos solo los puedes pedir para ti.</p>}
          </div>
          <div>
            <label className="label">¿Por qué?</label>
            <input name="reason" className="input" placeholder="Ej. no recogió su ropa / lavé el carro" />
          </div>
          <SubmitButton className="btn-primary w-full">{isAdmin ? "Anotar (queda aprobado)" : "Enviar para revisión"}</SubmitButton>
        </ActionForm>
      </Card>

      <Card title="Historial">
        {entries.length === 0 ? (
          <Empty>El pizarrón está limpio ✨</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-start gap-2">
                  <Avatar p={byId.get(e.hija)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold">
                        {displayName(byId.get(e.hija))}{" "}
                        <span className={e.amount > 0 ? "text-rose-600" : "text-emerald-600"}>
                          {e.amount > 0 ? `+${e.amount}` : e.amount}
                        </span>
                      </p>
                      <ReviewBadge s={e.status} />
                    </div>
                    <p className="text-sm text-slate-600">{DISH_KIND_LABEL[e.kind]}: {e.reason}</p>
                    <p className="text-xs text-slate-400">
                      Lo anotó {displayName(byId.get(e.created_by))} · {formatShort(e.created_at)}
                    </p>
                    {isAdmin && e.status === "pendiente" && <DishReview e={e} />}
                    {isAdmin && e.status !== "pendiente" && (
                      <div className="mt-1">
                        <ActButton action={deleteDishEntry.bind(null, e.id)} className="text-xs font-semibold text-slate-400" confirm="¿Borrar este movimiento?">
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
