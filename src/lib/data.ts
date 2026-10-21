import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, DebtAccount, DebtEntry, DishEntry, Handover, Obligation, Profile, TaskInstance } from "@/lib/types";
import { addDays, mondayOf, weekNumber, weekdayOf } from "@/lib/dates";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");
  const all = (profiles ?? []) as Profile[];
  const me = all.find((p) => p.id === user.id);
  if (!me) redirect("/login?error=sin-perfil");

  return {
    supabase,
    me,
    isAdmin: me.role === "admin",
    profiles: all,
    hijas: all.filter((p) => p.role === "hija"),
    byId: new Map(all.map((p) => [p.id, p])),
  };
});

export function displayName(p: Profile | undefined): string {
  if (!p) return "Alguien";
  return p.nickname || p.name;
}

export async function getInstancesForDay(day: string): Promise<TaskInstance[]> {
  const { supabase } = await getSession();
  await supabase.rpc("ensure_task_instances", { p_day: day });
  const { data } = await supabase
    .from("task_instances")
    .select("*, task:tasks(*)")
    .eq("day", day);
  return sortInstances((data ?? []) as TaskInstance[]);
}

const PRIORITY_ORDER = { alta: 0, normal: 1, baja: 2 } as const;
const STATUS_ORDER = { regresada: 0, por_hacer: 1, en_proceso: 2, para_revisar: 3, aprobada: 4 } as const;

export function sortInstances(list: TaskInstance[]): TaskInstance[] {
  return [...list].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      PRIORITY_ORDER[a.task.priority] - PRIORITY_ORDER[b.task.priority] ||
      (a.task.due_time ?? "99").localeCompare(b.task.due_time ?? "99"),
  );
}

/** Tareas de días anteriores que siguen sin aprobarse. */
export async function getOverdueInstances(today: string): Promise<TaskInstance[]> {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("task_instances")
    .select("*, task:tasks(*)")
    .lt("day", today)
    .neq("status", "aprobada")
    .order("day", { ascending: false })
    .limit(50);
  return (data ?? []) as TaskInstance[];
}

export async function getDishEntries(): Promise<DishEntry[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("dish_entries").select("*").order("created_at", { ascending: false });
  return (data ?? []) as DishEntry[];
}

export async function getDebtEntries(): Promise<DebtEntry[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("debt_entries").select("*").order("created_at", { ascending: false });
  return (data ?? []) as DebtEntry[];
}

export function dishBalance(entries: DishEntry[], hija: string): number {
  return entries.filter((e) => e.hija === hija && e.status === "aprobado").reduce((s, e) => s + e.amount, 0);
}

export async function getDebtAccounts(): Promise<DebtAccount[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("debt_accounts").select("*").order("created_at");
  return (data ?? []) as DebtAccount[];
}

export function accountBalance(entries: DebtEntry[], accountId: string): number {
  return entries
    .filter((e) => e.account_id === accountId && e.status === "aprobado")
    .reduce((s, e) => s + (e.kind === "cargo" ? Number(e.amount) : -Number(e.amount)), 0);
}

export function debtBalance(entries: DebtEntry[], hija: string): number {
  return entries
    .filter((e) => e.hija === hija && e.status === "aprobado")
    .reduce((s, e) => s + (e.kind === "cargo" ? Number(e.amount) : -Number(e.amount)), 0);
}

export async function getTodayAnnouncements(day: string): Promise<Announcement[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("announcements").select("*").eq("active", true).order("created_at");
  const dow = weekdayOf(day);
  return ((data ?? []) as Announcement[]).filter(
    (a) => a.on_date === day || (a.on_date === null && a.weekdays.includes(dow)) || (a.on_date === null && a.weekdays.length === 0),
  );
}


export const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const getObligationsData = cache(async () => {
  const { supabase } = await getSession();
  const [{ data }, { data: off }] = await Promise.all([
    supabase.from("obligations").select("*").eq("active", true).order("position").order("created_at"),
    supabase.from("settings").select("value").eq("key", "rotacion_offset").maybeSingle(),
  ]);
  return { obligations: (data ?? []) as Obligation[], offset: Number(off?.value ?? 0) };
});

/** Quién tiene cada obligación en la semana de `day`. */
export async function getRotation(day: string) {
  const { hijas } = await getSession();
  const { obligations, offset } = await getObligationsData();
  const order = [...hijas].sort((a, b) => a.name.localeCompare(b.name));
  const shift = weekNumber(day) + offset;
  const n = order.length;
  return {
    offset,
    rows: obligations.map((o, i) => ({
      obligation: o,
      hija: n ? order[(((i + shift) % n) + n) % n] : undefined,
    })),
  };
}

export type HandoverItem = {
  obligation: Obligation;
  hija: Profile | undefined;
  weekStart: string;
  handover: Handover | undefined;
};

/**
 * Entregas de esta semana y las que siguen sin entregarse de semanas anteriores.
 * Una obligación de la semana pasada sin entrega aprobada sigue siendo de quien la tenía.
 */
export async function getHandoverBoard(today: string) {
  const { supabase, byId } = await getSession();
  const monday = mondayOf(today);
  const lastMonday = addDays(monday, -7);
  const [current, last, { data }] = await Promise.all([
    getRotation(monday),
    getRotation(lastMonday),
    supabase.from("obligation_handovers").select("*").or(`week_start.gte.${lastMonday},status.neq.entregada`),
  ]);
  const handovers = (data ?? []) as Handover[];
  const find = (oid: string, week: string) => handovers.find((h) => h.obligation_id === oid && h.week_start === week);

  const thisWeek: HandoverItem[] = current.rows.map((r) => ({
    ...r,
    weekStart: monday,
    handover: find(r.obligation.id, monday),
  }));

  // La semana pasada: todo lo que no tenga entrega aprobada (si la obligación ya existía).
  const overdue: HandoverItem[] = last.rows
    .filter((r) => r.obligation.created_at.slice(0, 10) < monday)
    .map((r) => {
      const h = find(r.obligation.id, lastMonday);
      return { ...r, hija: h ? byId.get(h.hija) : r.hija, weekStart: lastMonday, handover: h };
    })
    .filter((it) => it.handover?.status !== "entregada");

  // Semanas más viejas que se marcaron sin entregar o siguen por revisar.
  const { obligations } = await getObligationsData();
  for (const h of handovers) {
    if (h.week_start >= lastMonday || h.status === "entregada") continue;
    const obligation = obligations.find((o) => o.id === h.obligation_id);
    if (obligation) overdue.push({ obligation, hija: byId.get(h.hija), weekStart: h.week_start, handover: h });
  }
  return { monday, thisWeek, overdue };
}
