import { redirect } from "next/navigation";
import { addAnnouncement, deleteAnnouncement } from "@/app/actions";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import { Card, Empty, PageTitle } from "@/components/ui";
import { getSession } from "@/lib/data";
import { WEEKDAYS, formatDate, todayMX } from "@/lib/dates";
import type { Announcement } from "@/lib/types";

function when(a: Announcement) {
  if (a.on_date) return `Solo el ${formatDate(a.on_date)}`;
  if (a.weekdays.length) return `Cada ${a.weekdays.map((d) => WEEKDAYS[d]).join(", ")}`;
  return "Siempre visible";
}

export default async function AnunciosPage() {
  const { supabase, isAdmin } = await getSession();
  if (!isAdmin) redirect("/");
  const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
  const list = (data ?? []) as Announcement[];

  return (
    <div className="space-y-4">
      <PageTitle sub="Salen hasta arriba en el inicio de todos">Anuncios 📣</PageTitle>
      <Card title="Nuevo anuncio">
        <ActionForm action={addAnnouncement}>
          <input name="body" className="input" placeholder="Ej. Hoy tenemos reunión" />
          <input name="show_time" className="input" placeholder="Hora o detalle (opcional), ej. 7:00 pm" />
          <fieldset className="space-y-2">
            <legend className="label">¿Cuándo aparece?</legend>
            <div className="flex flex-wrap gap-2">
              {[
                ["semanal", "Ciertos días de la semana"],
                ["fecha", "Un solo día"],
                ["siempre", "Siempre"],
              ].map(([v, l], i) => (
                <label key={v} className="chip">
                  <input type="radio" name="mode" value={v} defaultChecked={i === 0} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="mb-2 font-semibold text-slate-600">Días (si es semanal):</p>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => (
                  <label key={d} className="chip">
                    <input type="checkbox" name="weekdays" value={i} className="sr-only" />
                    {d}
                  </label>
                ))}
              </div>
              <p className="mt-3 mb-2 font-semibold text-slate-600">Fecha (si es un solo día):</p>
              <input type="date" name="on_date" defaultValue={todayMX()} className="input" />
            </div>
          </fieldset>
          <SubmitButton className="btn-primary w-full">Publicar</SubmitButton>
        </ActionForm>
      </Card>

      <Card title="Publicados">
        {list.length === 0 ? (
          <Empty>No hay anuncios.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-bold">{a.body}</p>
                  <p className="text-xs text-slate-500">
                    {when(a)}
                    {a.show_time && ` · ${a.show_time}`}
                  </p>
                </div>
                <ActButton action={deleteAnnouncement.bind(null, a.id)} className="btn-red" confirm="¿Borrar el anuncio?">
                  Borrar
                </ActButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
