import { CalendarSync, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Avatar, Card, Empty, IconTitle } from "@/components/ui";
import { displayName, getRotation, getSession } from "@/lib/data";
import { addDays, formatDate, mondayOf, todayMX } from "@/lib/dates";

/** Rol de obligaciones de esta semana y de la siguiente. */
export async function ObligationsCard() {
  const { me, isAdmin } = await getSession();
  const today = todayMX();
  const monday = mondayOf(today);
  const nextMonday = addDays(monday, 7);
  const [now, next] = await Promise.all([getRotation(today), getRotation(nextMonday)]);

  return (
    <Card
      title={<IconTitle icon={CalendarSync} className="text-teal-600">Obligaciones de la semana</IconTitle>}
      action={
        isAdmin && (
          <Link href="/tareas/obligaciones" className="text-sm font-bold text-brand-700">
            Editar <ChevronRight size={14} className="inline" />
          </Link>
        )
      }
    >
      <p className="-mt-2 mb-3 text-xs text-slate-500">
        Del {formatDate(monday)} al {formatDate(addDays(monday, 6))} · cambia cada lunes
      </p>
      {now.rows.length === 0 ? (
        <Empty>{isAdmin ? "Agrega las obligaciones en Editar." : "Todavía no hay obligaciones."}</Empty>
      ) : (
        <ul className="space-y-2">
          {now.rows.map(({ obligation, hija }, i) => {
            const nextHija = next.rows[i]?.hija;
            const mine = hija?.id === me.id;
            return (
              <li
                key={obligation.id}
                className={`flex items-center gap-3 rounded-xl p-3 ${mine ? "bg-teal-50 ring-2 ring-teal-400" : "bg-slate-50"}`}
              >
                <Avatar p={hija} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">{obligation.title}</p>
                  <p className="text-sm text-slate-600">
                    {displayName(hija)}
                    {mine && <span className="ml-1 font-bold text-teal-700">(tú)</span>}
                  </p>
                  {obligation.description && <p className="text-xs text-slate-500">{obligation.description}</p>}
                </div>
                {nextHija && (
                  <div className="text-right text-[11px] leading-tight text-slate-400">
                    Próxima
                    <br />
                    <span className="font-bold text-slate-500">{displayName(nextHija)}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
