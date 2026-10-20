import { ArrowLeft, ArrowRight, CalendarSync, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import { deleteObligation, saveObligation, shiftRotation } from "@/app/actions";
import { ObligationsCard } from "@/components/ObligationsCard";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import { Card, Empty, PageTitle } from "@/components/ui";
import { getSession } from "@/lib/data";
import type { Obligation } from "@/lib/types";

export default async function ObligacionesPage() {
  const { supabase, isAdmin } = await getSession();
  if (!isAdmin) redirect("/tareas");
  const { data } = await supabase.from("obligations").select("*").eq("active", true).order("position").order("created_at");
  const list = (data ?? []) as Obligation[];

  return (
    <div className="space-y-4">
      <PageTitle sub="Se turnan entre las niñas cada lunes" icon={CalendarSync} tone="green">Obligaciones</PageTitle>

      <ObligationsCard />

      <Card title="¿El rol quedó desfasado?">
        <p className="mb-3 text-sm text-slate-500">Recorre a quién le toca qué, sin esperar al lunes.</p>
        <div className="flex gap-2">
          <ActButton action={shiftRotation.bind(null, -1)}>
            <ArrowLeft size={16} /> Recorrer atrás
          </ActButton>
          <ActButton action={shiftRotation.bind(null, 1)}>
            Recorrer adelante <ArrowRight size={16} />
          </ActButton>
        </div>
      </Card>

      <Card title="Lista de obligaciones">
        {list.length === 0 ? (
          <Empty>Aún no hay obligaciones.</Empty>
        ) : (
          <ul className="mb-4 divide-y divide-slate-100">
            {list.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-bold">{o.title}</p>
                  {o.description && <p className="text-xs text-slate-500">{o.description}</p>}
                </div>
                <ActButton action={deleteObligation.bind(null, o.id)} className="btn-red" confirm="¿Borrar esta obligación?">
                  <Trash2 size={15} />
                </ActButton>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={saveObligation}>
          <input name="title" className="input" placeholder="Ej. Cocina, Baños, Sala y comedor" />
          <input name="description" className="input" placeholder="Descripción corta (opcional)" />
          <p className="text-xs text-slate-500">Lo que incluye hacerla y entregarla se detalla en la página de Reglas.</p>
          <SubmitButton className="btn-primary w-full">Agregar obligación</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
