import { saveTask } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar } from "@/components/ui";
import { displayName } from "@/lib/data";
import { WEEKDAYS, todayMX } from "@/lib/dates";
import type { Profile, Task } from "@/lib/types";

export function TaskForm({ task, people }: { task?: Task; people: Profile[] }) {
  return (
    <ActionForm action={saveTask} resetOnOk={false} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}
      <div>
        <label className="label">¿Qué hay que hacer?</label>
        <input name="title" required defaultValue={task?.title} className="input" placeholder="Ej. Tender la cama" />
      </div>
      <div>
        <label className="label">Detalles (opcional)</label>
        <textarea name="description" defaultValue={task?.description ?? ""} rows={2} className="input" />
      </div>

      <fieldset>
        <legend className="label">¿Para quién?</legend>
        <div className="flex flex-wrap gap-2">
          {people.map((p) => (
            <label key={p.id} className="chip gap-1.5">
              <input type="checkbox" name="assignees" value={p.id} defaultChecked={task?.assignees.includes(p.id)} className="sr-only" />
              <Avatar p={p} size={18} /> {displayName(p)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Prioridad</legend>
        <div className="flex gap-2">
          {[
            ["alta", "🔴 Alta"],
            ["normal", "🟡 Normal"],
            ["baja", "⚪ Baja"],
          ].map(([v, l]) => (
            <label key={v} className="chip">
              <input type="radio" name="priority" value={v} defaultChecked={(task?.priority ?? "normal") === v} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="label">¿Cada cuándo?</legend>
        <div className="flex gap-2">
          {[
            ["unica", "Una vez"],
            ["diaria", "Diario"],
            ["semanal", "Ciertos días"],
          ].map(([v, l]) => (
            <label key={v} className="chip">
              <input type="radio" name="recurrence" value={v} defaultChecked={(task?.recurrence ?? "unica") === v} className="peer sr-only" />
              {l}
            </label>
          ))}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="mb-2 font-semibold text-slate-600">Si es &quot;Una vez&quot;, ¿qué día?</p>
          <input type="date" name="due_date" defaultValue={task?.due_date ?? todayMX()} className="input" />
          <p className="mt-3 mb-2 font-semibold text-slate-600">Si es &quot;Ciertos días&quot;, ¿cuáles?</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d, i) => (
              <label key={d} className="chip">
                <input type="checkbox" name="weekdays" value={i} defaultChecked={task?.weekdays.includes(i)} className="sr-only" />
                {d}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <div>
        <label className="label">Hora límite (opcional)</label>
        <input type="time" name="due_time" defaultValue={task?.due_time?.slice(0, 5) ?? ""} className="input" />
      </div>

      <SubmitButton className="btn-primary w-full">{task ? "Guardar cambios" : "Crear tarea"}</SubmitButton>
    </ActionForm>
  );
}
