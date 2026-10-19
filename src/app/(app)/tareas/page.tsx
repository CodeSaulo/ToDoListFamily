import { ChevronLeft, ChevronRight, ListChecks, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { ObligationsCard } from "@/components/ObligationsCard";
import { TaskCard } from "@/components/TaskCard";
import { Avatar, Card, Empty, PageTitle } from "@/components/ui";
import { displayName, getInstancesForDay, getOverdueInstances, getSession } from "@/lib/data";
import { addDays, formatDay, todayMX } from "@/lib/dates";

export default async function TareasPage({ searchParams }: { searchParams: Promise<{ day?: string; p?: string }> }) {
  const { me, isAdmin, hijas, byId } = await getSession();
  const sp = await searchParams;
  const today = todayMX();
  const day = sp.day && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : today;
  const person = sp.p ?? (isAdmin ? "todas" : me.id);

  const [instances, overdue] = await Promise.all([
    getInstancesForDay(day),
    day === today ? getOverdueInstances(today) : Promise.resolve([]),
  ]);
  const filter = (list: typeof instances) => (person === "todas" ? list : list.filter((i) => i.assignee === person));
  const list = filter(instances);
  const late = filter(overdue);

  const q = (d: string, p = person) => `/tareas?day=${d}&p=${p}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <PageTitle sub={formatDay(day)} icon={ListChecks} tone="blue">Tareas</PageTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/tareas/gestionar" className="btn-soft" aria-label="Gestionar"><Settings2 size={16} /></Link>
            <Link href="/tareas/nueva" className="btn-primary"><Plus size={16} strokeWidth={3} /> Nueva</Link>
          </div>
        )}
      </div>

      <ObligationsCard />

      <div className="flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
        <Link href={q(addDays(day, -1))} className="btn-soft"><ChevronLeft size={16} /> Ayer</Link>
        {day !== today ? (
          <Link href={q(today)} className="text-sm font-bold text-brand-700">Ir a hoy</Link>
        ) : (
          <span className="text-sm font-bold text-slate-500">Hoy</span>
        )}
        <Link href={q(addDays(day, 1))} className="btn-soft">Mañana <ChevronRight size={16} /></Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href={q(day, "todas")} className={`chip ${person === "todas" ? "!border-brand-600 !bg-brand-600 !text-white" : ""}`}>Todas</Link>
        {hijas.map((h) => (
          <Link key={h.id} href={q(day, h.id)} className={`chip gap-1.5 ${person === h.id ? "!border-brand-600 !bg-brand-600 !text-white" : ""}`}>
            <Avatar p={h} size={18} /> {displayName(h)}
          </Link>
        ))}
      </div>

      {late.length > 0 && (
        <Card title={<span className="text-rose-700">Atrasadas</span>}>
          <div className="space-y-2">
            {late.map((i) => (
              <TaskCard key={i.id} inst={i} me={me} byId={byId} today={today} />
            ))}
          </div>
        </Card>
      )}

      <Card title={day === today ? "Hoy" : formatDay(day)}>
        {list.length === 0 ? (
          <Empty>No hay tareas para este día.</Empty>
        ) : (
          <div className="space-y-2">
            {list.map((i) => (
              <TaskCard key={i.id} inst={i} me={me} byId={byId} today={today} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
