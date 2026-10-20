import { BookOpen, CircleCheck, Handshake, Pencil, ScrollText } from "lucide-react";
import { saveGeneralRules, saveObligation } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Empty, IconTitle, PageTitle } from "@/components/ui";
import { getSession } from "@/lib/data";
import type { Obligation } from "@/lib/types";

function lines(text: string | null) {
  return (text ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean);
}

function Checklist({ text, empty }: { text: string | null; empty: string }) {
  const items = lines(text);
  if (items.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((l, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <CircleCheck size={16} className="mt-0.5 shrink-0 text-teal-500" />
          {l}
        </li>
      ))}
    </ul>
  );
}

export default async function ReglasPage() {
  const { supabase, isAdmin } = await getSession();
  const [{ data }, { data: general }] = await Promise.all([
    supabase.from("obligations").select("*").eq("active", true).order("position").order("created_at"),
    supabase.from("settings").select("value").eq("key", "reglas_generales").maybeSingle(),
  ]);
  const obligations = (data ?? []) as Obligation[];
  const generalText = typeof general?.value === "string" ? general.value : "";

  return (
    <div className="space-y-4">
      <PageTitle sub="Qué incluye cada obligación y cómo se entrega" icon={BookOpen} tone="violet">
        Reglas
      </PageTitle>

      <Card title={<IconTitle icon={ScrollText} className="text-violet-600">Reglas generales</IconTitle>}>
        <Checklist
          text={generalText}
          empty={isAdmin ? "Escribe aquí las reglas de la casa." : "Todavía no hay reglas generales."}
        />
        {isAdmin && (
          <details className="mt-3">
            <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-brand-700">
              <Pencil size={14} /> Editar
            </summary>
            <ActionForm action={saveGeneralRules} className="mt-2 space-y-2" resetOnOk={false}>
              <textarea name="rules" rows={5} defaultValue={generalText} className="input" placeholder="Una regla por renglón" />
              <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
            </ActionForm>
          </details>
        )}
      </Card>

      {obligations.length === 0 && <Empty>Todavía no hay obligaciones.</Empty>}

      {obligations.map((o) => (
        <Card key={o.id} title={o.title}>
          {o.description && <p className="-mt-2 mb-3 text-sm text-slate-500">{o.description}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
                <CircleCheck size={16} className="text-teal-600" /> Qué incluye hacerla
              </h3>
              <Checklist text={o.includes} empty="Sin detallar todavía." />
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
                <Handshake size={16} className="text-orange-500" /> Para entregarla
              </h3>
              <Checklist text={o.handover_rules} empty="Sin detallar todavía." />
            </div>
          </div>
          {isAdmin && (
            <details className="mt-3">
              <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-brand-700">
                <Pencil size={14} /> Editar
              </summary>
              <ActionForm action={saveObligation} className="mt-2 space-y-2" resetOnOk={false}>
                <input type="hidden" name="id" value={o.id} />
                <input name="title" defaultValue={o.title} className="input" />
                <input name="description" defaultValue={o.description ?? ""} className="input" placeholder="Descripción corta (opcional)" />
                <label className="label">Qué incluye hacerla (un punto por renglón)</label>
                <textarea name="includes" rows={5} defaultValue={o.includes ?? ""} className="input" placeholder={"Tallar el lavabo\nLimpiar el espejo\nTrapear"} />
                <label className="label">Qué incluye entregarla (un punto por renglón)</label>
                <textarea name="handover_rules" rows={4} defaultValue={o.handover_rules ?? ""} className="input" placeholder={"Cambiar toallas\nSacar la basura\nReponer papel"} />
                <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
              </ActionForm>
            </details>
          )}
        </Card>
      ))}
    </div>
  );
}
