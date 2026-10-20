import { AlertTriangle, BookOpen, CalendarSync, Check, ChevronRight, Clock, Send, X } from "lucide-react";
import Link from "next/link";
import { markHandover } from "@/app/actions";
import { ActButton } from "@/components/forms";
import { Avatar, Card, Empty, IconTitle } from "@/components/ui";
import { displayName, getHandoverBoard, getRotation, getSession, type HandoverItem } from "@/lib/data";
import { addDays, formatDate, todayMX } from "@/lib/dates";
import type { HandoverStatus, Profile } from "@/lib/types";

const STATUS: Record<HandoverStatus | "pendiente", { label: string; className: string }> = {
  pendiente: { label: "Por entregar", className: "bg-slate-100 text-slate-600" },
  por_revisar: { label: "Entrega por revisar", className: "bg-violet-100 text-violet-800" },
  entregada: { label: "Entregada", className: "bg-emerald-100 text-emerald-800" },
  no_entregada: { label: "No entregada", className: "bg-rose-100 text-rose-700" },
};

/** Rol de obligaciones de la semana, con su entrega y las que quedaron sin entregar. */
export async function ObligationsCard() {
  const { me, isAdmin } = await getSession();
  const today = todayMX();
  const { monday, thisWeek, overdue } = await getHandoverBoard(today);
  const next = await getRotation(addDays(monday, 7));

  return (
    <Card
      title={<IconTitle icon={CalendarSync} className="text-teal-600">Obligaciones de la semana</IconTitle>}
      action={
        <div className="flex gap-3">
          <Link href="/reglas" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
            <BookOpen size={14} /> Reglas
          </Link>
          {isAdmin && (
            <Link href="/tareas/obligaciones" className="text-sm font-bold text-brand-700">
              Editar <ChevronRight size={14} className="inline" />
            </Link>
          )}
        </div>
      }
    >
      <p className="-mt-2 mb-3 text-xs text-slate-500">
        Del {formatDate(monday)} al {formatDate(addDays(monday, 6))} · se entrega a la hermana al terminar la semana
      </p>

      {overdue.length > 0 && (
        <div className="mb-3 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-rose-700">
            <AlertTriangle size={16} /> Sin entregar: siguen teniéndola hasta entregarla
          </p>
          <ul className="space-y-2">
            {overdue.map((it) => (
              <HandoverRow key={`${it.obligation.id}-${it.weekStart}`} it={it} me={me} isAdmin={isAdmin} overdue />
            ))}
          </ul>
        </div>
      )}

      {thisWeek.length === 0 ? (
        <Empty>{isAdmin ? "Agrega las obligaciones en Editar." : "Todavía no hay obligaciones."}</Empty>
      ) : (
        <ul className="space-y-2">
          {thisWeek.map((it, i) => {
            const extra = overdue.filter((o) => o.hija?.id === it.hija?.id).length;
            return (
              <HandoverRow key={it.obligation.id} it={it} me={me} isAdmin={isAdmin} nextHija={next.rows[i]?.hija} extra={extra} />
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function HandoverRow({
  it,
  me,
  isAdmin,
  nextHija,
  extra = 0,
  overdue = false,
}: {
  it: HandoverItem;
  me: Profile;
  isAdmin: boolean;
  nextHija?: Profile;
  extra?: number;
  overdue?: boolean;
}) {
  const { obligation, hija, weekStart, handover } = it;
  const mine = hija?.id === me.id;
  const status = handover?.status ?? "pendiente";
  const s = STATUS[status];
  const mark = (st: HandoverStatus) => markHandover.bind(null, obligation.id, weekStart, hija?.id ?? "", st);

  return (
    <li className={`rounded-xl p-3 ${overdue ? "bg-white" : mine ? "bg-teal-50 ring-2 ring-teal-400" : "bg-slate-50"}`}>
      <div className="flex items-center gap-3">
        <Avatar p={hija} size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">{obligation.title}</p>
          <p className="text-sm text-slate-600">
            {displayName(hija)}
            {mine && <span className="ml-1 font-bold text-teal-700">(tú)</span>}
            {overdue && <span className="text-slate-400"> · semana del {formatDate(weekStart)}</span>}
          </p>
          {extra > 0 && (
            <p className="text-xs font-bold text-rose-600">
              Esta semana tiene {extra + 1} obligaciones
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.className}`}>{s.label}</span>
          {nextHija && (
            <span className="text-[11px] text-slate-400">
              Sigue: <b className="text-slate-500">{displayName(nextHija)}</b>
            </span>
          )}
        </div>
      </div>

      {hija && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!isAdmin && mine && (status === "pendiente" || status === "no_entregada") && (
            <ActButton action={mark("por_revisar")} className="btn-primary !py-1.5">
              <Send size={14} /> Ya la entregué
            </ActButton>
          )}
          {!isAdmin && mine && status === "por_revisar" && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700">
              <Clock size={13} /> Esperando el visto bueno
            </span>
          )}
          {isAdmin && status !== "entregada" && (
            <ActButton action={mark("entregada")} className="btn-green !py-1.5">
              <Check size={14} strokeWidth={3} /> Entregó
            </ActButton>
          )}
          {isAdmin && status !== "no_entregada" && (
            <ActButton action={mark("no_entregada")} className="btn-red !py-1.5">
              <X size={14} /> No entregó
            </ActButton>
          )}
        </div>
      )}
    </li>
  );
}
