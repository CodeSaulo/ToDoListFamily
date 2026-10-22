import { CircleCheck, Clock, Dog, Pencil } from "lucide-react";
import { saveCookieShift } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Empty, IconTitle } from "@/components/ui";
import { getSession } from "@/lib/data";
import { TZ } from "@/lib/dates";
import type { CookieShift } from "@/lib/types";

const PEOPLE = ["Renata", "Rebeka", "Romina"];

/** "07:00:00" → "7:00 am" */
function hora(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function nowHHMM() {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(new Date());
}

export async function getCookieShifts(): Promise<CookieShift[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("cookie_shifts").select("*").order("position").order("start_time");
  return (data ?? []) as CookieShift[];
}

export function currentShift(shifts: CookieShift[]): CookieShift | undefined {
  const now = nowHHMM();
  return shifts.find((s) => s.start_time.slice(0, 5) <= now && now < s.end_time.slice(0, 5));
}

/** Los 3 horarios para cuidar a Cookie, con quién le toca y qué hacer. */
export async function CookieCard() {
  const { isAdmin } = await getSession();
  const shifts = await getCookieShifts();
  const current = currentShift(shifts);

  return (
    <Card title={<IconTitle icon={Dog} className="text-amber-600">Obligaciones Cookie</IconTitle>}>
      {shifts.length === 0 ? (
        <Empty>Todavía no hay horarios.</Empty>
      ) : (
        <ul className="space-y-2">
          {shifts.map((s) => {
            const active = s.id === current?.id;
            const tasks = (s.tasks ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
            return (
              <li key={s.id} className={`rounded-xl p-3 ${active ? "bg-amber-50 ring-2 ring-amber-400" : "bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-extrabold leading-tight">{s.label}</p>
                    <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock size={12} /> {hora(s.start_time)} a {hora(s.end_time)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{s.person_name || "Sin asignar"}</p>
                    {active && <span className="text-[11px] font-bold text-amber-700">Le toca ahorita</span>}
                  </div>
                </div>
                {tasks.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {tasks.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <CircleCheck size={15} className="mt-0.5 shrink-0 text-amber-500" /> {t}
                      </li>
                    ))}
                  </ul>
                )}
                {isAdmin && (
                  <details className="mt-2">
                    <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-brand-700">
                      <Pencil size={13} /> Editar
                    </summary>
                    <ActionForm action={saveCookieShift} className="mt-2 space-y-2" resetOnOk={false}>
                      <input type="hidden" name="id" value={s.id} />
                      <input name="label" defaultValue={s.label} className="input" placeholder="Nombre del horario" />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs font-semibold text-slate-500">
                          De
                          <input type="time" name="start_time" defaultValue={s.start_time.slice(0, 5)} className="input" />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          A
                          <input type="time" name="end_time" defaultValue={s.end_time.slice(0, 5)} className="input" />
                        </label>
                      </div>
                      <input name="person_name" list="cookie-people" defaultValue={s.person_name ?? ""} className="input" placeholder="¿A quién le toca?" />
                      <textarea name="tasks" rows={3} defaultValue={s.tasks ?? ""} className="input" placeholder={"Darle de comer\nSacarla a pasear\nCambiar el agua"} />
                      <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
                    </ActionForm>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <datalist id="cookie-people">
        {PEOPLE.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </Card>
  );
}
