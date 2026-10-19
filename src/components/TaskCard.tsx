import { Check, MessageCircle, Play, RotateCcw, Undo2 } from "lucide-react";
import { returnTask, setTaskStatus } from "@/app/actions";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, PriorityBadge, StatusBadge } from "@/components/ui";
import { displayName } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import type { Profile, TaskInstance } from "@/lib/types";

export function TaskCard({
  inst,
  me,
  byId,
  today,
  showAssignee = true,
}: {
  inst: TaskInstance;
  me: Profile;
  byId: Map<string, Profile>;
  today: string;
  showAssignee?: boolean;
}) {
  const isAdmin = me.role === "admin";
  const mine = inst.assignee === me.id;
  const late = inst.day < today && inst.status !== "aprobada";
  const assignee = byId.get(inst.assignee);
  const set = (s: TaskInstance["status"]) => setTaskStatus.bind(null, inst.id, s);
  const s = inst.status;

  return (
    <article
      className={`rounded-xl border p-3 ${s === "aprobada" ? "border-emerald-100 bg-emerald-50/40" : late ? "border-rose-200 bg-rose-50/40" : "border-slate-100 bg-white"}`}
    >
      <div className="flex items-start gap-2">
        {showAssignee && <Avatar p={assignee} />}
        <div className="min-w-0 flex-1">
          <p className={`font-bold leading-tight ${s === "aprobada" ? "text-slate-400 line-through" : ""}`}>{inst.task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <PriorityBadge p={inst.task.priority} />
            <StatusBadge s={s} late={late} />
            {showAssignee && <span>{displayName(assignee)}</span>}
            {inst.task.due_time && <span>· {inst.task.due_time.slice(0, 5)}</span>}
            {inst.day !== today && <span>· {formatDate(inst.day)}</span>}
          </div>
          {inst.task.description && <p className="mt-1 text-sm text-slate-600">{inst.task.description}</p>}
          {inst.review_note && (
            <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-orange-50 px-2 py-1 text-sm text-orange-800">
              <MessageCircle size={15} className="mt-0.5 shrink-0" /> {inst.review_note}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {mine && !isAdmin && (s === "por_hacer" || s === "regresada") && (
          <>
            <ActButton action={set("en_proceso")}>
              <Play size={15} /> Empezar
            </ActButton>
            <ActButton action={set("para_revisar")} className="btn-primary">
              <Check size={16} strokeWidth={3} /> ¡Ya terminé!
            </ActButton>
          </>
        )}
        {mine && !isAdmin && s === "en_proceso" && (
          <>
            <ActButton action={set("por_hacer")}>
              <Undo2 size={15} /> Todavía no
            </ActButton>
            <ActButton action={set("para_revisar")} className="btn-primary">
              <Check size={16} strokeWidth={3} /> ¡Ya terminé!
            </ActButton>
          </>
        )}
        {mine && !isAdmin && s === "para_revisar" && <ActButton action={set("en_proceso")}>
            <Undo2 size={15} /> Me faltó algo
          </ActButton>}

        {isAdmin && s !== "aprobada" && (
          <>
            <ActButton action={set("aprobada")} className="btn-green">
              <Check size={16} strokeWidth={3} /> Aprobar
            </ActButton>
            <details className="w-full">
              <summary className="cursor-pointer text-sm font-semibold text-orange-700">Regresar con comentario</summary>
              <ActionForm action={returnTask} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={inst.id} />
                <input name="note" className="input" placeholder="Ej. falta barrer debajo de la mesa" />
                <SubmitButton className="btn-soft">Regresar</SubmitButton>
              </ActionForm>
            </details>
          </>
        )}
        {isAdmin && s === "aprobada" && (
          <ActButton action={set("por_hacer")} className="btn-soft">
            <RotateCcw size={15} /> Deshacer
          </ActButton>
        )}
      </div>
    </article>
  );
}
