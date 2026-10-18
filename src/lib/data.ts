import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, DebtEntry, DishEntry, Profile, TaskInstance } from "@/lib/types";
import { weekdayOf } from "@/lib/dates";

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

export async function getTarifaBloque(): Promise<number> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("settings").select("value").eq("key", "tarifa_bloque").maybeSingle();
  return Number(data?.value ?? 0);
}

export const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
