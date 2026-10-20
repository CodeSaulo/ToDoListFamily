import { CalendarDays, ChefHat, Clock, Lightbulb, Plus, Salad, Trash2, Undo2, X } from "lucide-react";
import { addMeal, deleteMeal, rejectMeal, scheduleMeal, unscheduleMeal } from "@/app/actions";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Card, Empty, IconTitle, PageTitle } from "@/components/ui";
import { displayName, getSession } from "@/lib/data";
import { WEEKDAYS, addDays, formatDate, todayMX, weekdayOf } from "@/lib/dates";
import { recetasDelDia, type Receta } from "@/lib/recetas";
import { SLOT_LABEL, type Meal, type MealSlot } from "@/lib/types";

const DAYS = 15;
const SLOT_ORDER: Record<MealSlot, number> = { desayuno: 0, comida: 1, cena: 2 };

export default async function GuisadosPage() {
  const { supabase, me, isAdmin, byId } = await getSession();
  const today = todayMX();
  const last = addDays(today, DAYS - 1);
  const [{ data: scheduled }, { data: proposed }] = await Promise.all([
    supabase.from("meals").select("*").eq("status", "aceptado").gte("day", today).lte("day", last),
    supabase.from("meals").select("*").eq("status", "propuesto").order("created_at", { ascending: false }),
  ]);
  const meals = (scheduled ?? []) as Meal[];
  const proposals = (proposed ?? []) as Meal[];
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, i));

  return (
    <div className="space-y-4">
      <PageTitle sub="Lo que vamos a cocinar los próximos 15 días" icon={ChefHat} tone="orange">
        Guisados
      </PageTitle>

      <Card title={<IconTitle icon={CalendarDays} className="text-orange-500">Calendario</IconTitle>}>
        <div className="grid gap-2 sm:grid-cols-3">
          {days.map((d) => {
            const dow = weekdayOf(d);
            const weekend = dow === 0 || dow === 6;
            const list = meals.filter((m) => m.day === d).sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]);
            return (
              <div
                key={d}
                className={`rounded-xl p-3 ${d === today ? "bg-orange-50 ring-2 ring-orange-400" : weekend ? "bg-amber-50/60" : "bg-slate-50"}`}
              >
                <p className="mb-1 flex items-baseline justify-between text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  <span>
                    {WEEKDAYS[dow]} {formatDate(d)}
                  </span>
                  {d === today && <span className="text-orange-600">Hoy</span>}
                </p>
                {list.length === 0 ? (
                  <p className="text-sm text-slate-300">Sin guisado</p>
                ) : (
                  <ul className="space-y-1">
                    {list.map((m) => (
                      <li key={m.id} className="flex items-start justify-between gap-1">
                        <div>
                          <p className="text-sm font-bold leading-tight">{m.title}</p>
                          <p className="text-[11px] text-slate-500">{SLOT_LABEL[m.slot]}</p>
                        </div>
                        {isAdmin && (
                          <ActButton action={unscheduleMeal.bind(null, m.id)} className="text-slate-400 hover:text-slate-600">
                            <Undo2 size={14} />
                          </ActButton>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={<IconTitle icon={Plus} className="text-brand-600">Proponer un guisado</IconTitle>}>
        <ActionForm action={addMeal}>
          <input name="title" className="input" placeholder="Ej. Tinga de pollo" />
          <input name="notes" className="input" placeholder="Nota o receta (opcional)" />
          {isAdmin && (
            <div className="grid grid-cols-2 gap-2">
              <DayPicker days={days} />
              <SlotPicker />
            </div>
          )}
          <SubmitButton className="btn-primary w-full">
            {isAdmin ? "Guardar (con día queda en el calendario)" : "Proponer"}
          </SubmitButton>
        </ActionForm>
      </Card>

      <Card title={`Propuestas (${proposals.length})`}>
        {proposals.length === 0 ? (
          <Empty>No hay propuestas. ¡Propón algo rico!</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proposals.map((m) => (
              <li key={m.id} className="py-3">
                <div className="flex items-start gap-2">
                  <Avatar p={byId.get(m.proposed_by ?? "")} size={28} />
                  <div className="flex-1">
                    <p className="font-bold">{m.title}</p>
                    {m.notes && <p className="text-sm text-slate-600">{m.notes}</p>}
                    <p className="text-xs text-slate-400">Lo propuso {displayName(byId.get(m.proposed_by ?? ""))}</p>
                  </div>
                  {(isAdmin || m.proposed_by === me.id) && (
                    <ActButton action={deleteMeal.bind(null, m.id)} className="text-slate-400 hover:text-rose-600" confirm="¿Borrar esta propuesta?">
                      <Trash2 size={15} />
                    </ActButton>
                  )}
                </div>
                {isAdmin && (
                  <ActionForm action={scheduleMeal} className="mt-2 flex flex-wrap items-center gap-2" resetOnOk={false}>
                    <input type="hidden" name="id" value={m.id} />
                    <DayPicker days={days} compact />
                    <SlotPicker compact />
                    <SubmitButton className="btn-green !py-2">Aceptar</SubmitButton>
                    <ActButton action={rejectMeal.bind(null, m.id)} className="btn-red !py-2">
                      <X size={14} />
                    </ActButton>
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Suggestions today={today} />
    </div>
  );
}

function DayPicker({ days, compact }: { days: string[]; compact?: boolean }) {
  return (
    <select name="day" className={`input ${compact ? "!w-auto !py-2" : ""}`} defaultValue="">
      <option value="">{compact ? "Día…" : "Sin día (solo propuesta)"}</option>
      {days.map((d) => (
        <option key={d} value={d}>
          {WEEKDAYS[weekdayOf(d)]} {formatDate(d)}
        </option>
      ))}
    </select>
  );
}

function SlotPicker({ compact }: { compact?: boolean }) {
  return (
    <select name="slot" className={`input ${compact ? "!w-auto !py-2" : ""}`} defaultValue="comida">
      {(Object.keys(SLOT_LABEL) as MealSlot[]).map((s) => (
        <option key={s} value={s}>
          {SLOT_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function Suggestions({ today }: { today: string }) {
  const finde = recetasDelDia(today, true, 4);
  const semana = recetasDelDia(today, false, 4);
  return (
    <Card title={<IconTitle icon={Lightbulb} className="text-amber-500">Ideas saludables y sencillas</IconTitle>}>
      <h3 className="mb-2 text-sm font-extrabold text-orange-600">Para el fin de semana</h3>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {finde.map((r) => (
          <RecipeCard key={r.title} r={r} />
        ))}
      </div>
      <h3 className="mb-2 text-sm font-extrabold text-teal-600">Entre semana</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {semana.map((r) => (
          <RecipeCard key={r.title} r={r} />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">Las ideas cambian cada día.</p>
    </Card>
  );
}

function RecipeCard({ r }: { r: Receta }) {
  return (
    <details className="group rounded-xl bg-slate-50 p-3 open:bg-white open:ring-1 open:ring-slate-200">
      <summary className="flex cursor-pointer list-none items-start gap-2">
        <Salad size={18} className="mt-0.5 shrink-0 text-emerald-500" />
        <div className="flex-1">
          <p className="font-bold leading-tight">{r.title}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={12} /> {r.minutes} min · {SLOT_LABEL[r.slot]}
          </p>
        </div>
      </summary>
      <div className="mt-2 space-y-2 text-sm text-slate-700">
        <div>
          <p className="font-bold text-slate-600">Ingredientes</p>
          <ul className="list-disc pl-5">
            {r.ingredients.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-slate-600">Cómo se hace</p>
          <ol className="list-decimal pl-5">
            {r.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        <ActionForm action={addMeal} className="pt-1">
          <input type="hidden" name="title" value={r.title} />
          <input type="hidden" name="notes" value={`Receta sugerida · ${r.minutes} min`} />
          <input type="hidden" name="slot" value={r.slot} />
          <SubmitButton className="btn-soft w-full">
            <Plus size={15} /> Proponer este
          </SubmitButton>
        </ActionForm>
      </div>
    </details>
  );
}
