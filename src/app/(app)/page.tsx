import { CookingPot, LogOut, Megaphone, PartyPopper, Plus, StickyNote, Users, Wallet, ChevronRight, ClipboardCheck, ListChecks } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { TaskCard } from "@/components/TaskCard";
import { Avatar, Card, Empty, IconTile, IconTitle } from "@/components/ui";
import {
  debtBalance,
  dishBalance,
  displayName,
  getDebtEntries,
  getDishEntries,
  getInstancesForDay,
  getOverdueInstances,
  getSession,
  getTodayAnnouncements,
  money,
} from "@/lib/data";
import { formatDay, formatShort, todayMX } from "@/lib/dates";
import type { Note } from "@/lib/types";

export default async function Home() {
  const { supabase, me, isAdmin, hijas, byId } = await getSession();
  const today = todayMX();
  const [instances, overdue, dishes, debts, announcements, notesRes] = await Promise.all([
    getInstancesForDay(today),
    getOverdueInstances(today),
    getDishEntries(),
    getDebtEntries(),
    getTodayAnnouncements(today),
    supabase.from("notes").select("*").eq("done", false).order("created_at", { ascending: false }).limit(5),
  ]);
  const notes = (notesRes.data ?? []) as Note[];

  const myTasks = [...overdue, ...instances].filter((i) => i.assignee === me.id);
  const toReview = [...overdue, ...instances].filter((i) => i.status === "para_revisar");
  const pendingDishes = dishes.filter((d) => d.status === "pendiente").length;
  const pendingDebts = debts.filter((d) => d.status === "pendiente").length;

  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 p-5 text-white shadow-lg shadow-violet-200">
        <div className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-white/15" />
        <div className="absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar p={me} size={48} />
            <div>
              <p className="text-sm font-semibold text-white/80 first-letter:uppercase">{formatDay(today)}</p>
              <h1 className="text-2xl font-extrabold leading-tight">¡Hola, {displayName(me)}!</h1>
            </div>
          </div>
          <form action={signOut}>
            <button className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-white/30" aria-label="Salir">
              <LogOut size={14} /> Salir
            </button>
          </form>
        </div>
      </header>

      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-white shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/25">
                <Megaphone size={22} strokeWidth={2.25} />
              </span>
              <div>
                <p className="font-extrabold leading-tight">{a.body}</p>
                {a.show_time && <p className="text-sm font-semibold opacity-90">{a.show_time}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <Card title={<IconTitle icon={ClipboardCheck} className="text-violet-600">Por revisar</IconTitle>} action={<Link href="/revisar" className="text-sm font-bold text-brand-700">Ver todo <ChevronRight size={14} className="inline" /></Link>}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <ReviewTile href="/revisar" n={toReview.length} label="Tareas" />
            <ReviewTile href="/revisar" n={pendingDishes} label="Trastes" />
            <ReviewTile href="/revisar" n={pendingDebts} label="Abonos" />
          </div>
        </Card>
      )}

      {!isAdmin && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/trastes" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <IconTile icon={CookingPot} tone="orange" />
            <p className="mt-2 text-3xl font-extrabold">{dishBalance(dishes, me.id)}</p>
            <p className="text-xs font-bold text-slate-500">Tandas de trastes</p>
          </Link>
          <Link href="/deudas" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <IconTile icon={Wallet} tone="green" />
            <p className="mt-2 text-2xl font-extrabold">{money(debtBalance(debts, me.id))}</p>
            <p className="text-xs font-bold text-slate-500">Lo que debo</p>
          </Link>
        </div>
      )}

      {!isAdmin && (
        <Card title={<IconTitle icon={ListChecks}>Mis tareas de hoy</IconTitle>}>
          {myTasks.length === 0 ? (
            <Empty>
              <PartyPopper size={28} className="mx-auto mb-1 text-fuchsia-500" />
              No tienes tareas pendientes
            </Empty>
          ) : (
            <div className="space-y-2">
              {myTasks.map((i) => (
                <TaskCard key={i.id} inst={i} me={me} byId={byId} today={today} showAssignee={false} />
              ))}
            </div>
          )}
        </Card>
      )}

      <Card title={<IconTitle icon={Users} className="text-fuchsia-600">La familia hoy</IconTitle>} action={<Link href="/tareas" className="text-sm font-bold text-brand-700">Tareas <ChevronRight size={14} className="inline" /></Link>}>
        <div className="space-y-3">
          {hijas.map((h) => {
            const list = instances.filter((i) => i.assignee === h.id);
            const doneCount = list.filter((i) => i.status === "aprobada").length;
            const late = overdue.filter((i) => i.assignee === h.id).length;
            const pct = list.length ? Math.round((doneCount / list.length) * 100) : 0;
            return (
              <div key={h.id} className="flex items-center gap-3">
                <Avatar p={h} size={36} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{displayName(h)}</span>
                    <span className="text-slate-500">
                      {doneCount}/{list.length}
                      {late > 0 && <span className="ml-2 text-rose-600">{late} atrasada{late > 1 ? "s" : ""}</span>}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: h.color }} />
                  </div>
                  <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><CookingPot size={13} /> {dishBalance(dishes, h.id)} tandas</span>
                    <span className="inline-flex items-center gap-1"><Wallet size={13} /> {money(debtBalance(debts, h.id))}</span>
                  </p>
                </div>
              </div>
            );
          })}
          {hijas.length === 0 && <Empty>Todavía no hay hijas registradas.</Empty>}
        </div>
      </Card>

      <Card title={<IconTitle icon={StickyNote} className="text-amber-500">Recados</IconTitle>} action={<Link href="/recados" className="text-sm font-bold text-brand-700">Ver y pegar <ChevronRight size={14} className="inline" /></Link>}>
        {notes.length === 0 ? (
          <Empty>Sin recados pendientes.</Empty>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="flex items-start gap-2 rounded-xl bg-yellow-50 p-3">
                <Avatar p={byId.get(n.created_by)} size={24} />
                <div>
                  <p className="text-sm font-semibold">{n.body}</p>
                  <p className="text-xs text-slate-500">
                    {displayName(byId.get(n.created_by))} · {formatShort(n.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Link href="/tareas/nueva" className="btn-primary"><Plus size={16} strokeWidth={3} /> Nueva tarea</Link>
          <Link href="/anuncios" className="btn-soft"><Megaphone size={16} /> Anuncios</Link>
          <Link href="/familia" className="btn-soft"><Users size={16} /> Familia</Link>
        </div>
      )}
    </div>
  );
}

function ReviewTile({ href, n, label }: { href: string; n: number; label: string }) {
  return (
    <Link href={href} className={`rounded-xl p-3 ${n > 0 ? "bg-violet-50 text-violet-800" : "bg-slate-50 text-slate-400"}`}>
      <p className="text-2xl font-extrabold">{n}</p>
      <p className="text-xs font-bold">{label}</p>
    </Link>
  );
}
