import Link from "next/link";
import { redirect } from "next/navigation";
import { deactivateTask, deleteTask } from "@/app/actions";
import { ActButton } from "@/components/forms";
import { Avatar, Card, Empty, PageTitle, PriorityBadge } from "@/components/ui";
import { getSession } from "@/lib/data";
import { WEEKDAYS, formatDate } from "@/lib/dates";
import type { Task } from "@/lib/types";

function when(t: Task) {
  if (t.recurrence === "diaria") return "Diario";
  if (t.recurrence === "semanal") return t.weekdays.map((d) => WEEKDAYS[d]).join(", ");
  return t.due_date ? `Una vez · ${formatDate(t.due_date)}` : "Una vez";
}

export default async function GestionarTareas() {
  const { supabase, isAdmin, byId } = await getSession();
  if (!isAdmin) redirect("/tareas");
  const { data } = await supabase.from("tasks").select("*").eq("active", true).order("created_at", { ascending: false });
  const tasks = (data ?? []) as Task[];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageTitle sub="Todas las tareas que han creado">Gestionar tareas</PageTitle>
        <Link href="/tareas/nueva" className="btn-primary">+ Nueva</Link>
      </div>
      <Card>
        {tasks.length === 0 ? (
          <Empty>Aún no hay tareas. Crea la primera.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <PriorityBadge p={t.priority} />
                      <span>{when(t)}</span>
                      <span className="flex -space-x-1">
                        {t.assignees.map((a) => (
                          <Avatar key={a} p={byId.get(a)} size={18} />
                        ))}
                      </span>
                    </div>
                  </div>
                  <Link href={`/tareas/${t.id}`} className="btn-soft">Editar</Link>
                </div>
                <div className="mt-2 flex gap-2">
                  <ActButton action={deactivateTask.bind(null, t.id)} confirm="¿Archivar? Ya no se crearán nuevas, pero queda el historial.">
                    Archivar
                  </ActButton>
                  <ActButton action={deleteTask.bind(null, t.id)} className="btn-red" confirm="¿Borrar la tarea y todo su historial?">
                    Borrar
                  </ActButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
