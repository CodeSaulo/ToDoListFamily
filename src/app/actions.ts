"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

export type ActionState = { error?: string; ok?: string } | undefined;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function done(error: { message: string } | null, ok: string): ActionState {
  if (error) return { error: friendly(error.message) };
  revalidatePath("/", "layout");
  return { ok };
}

function friendly(message: string): string {
  if (message.includes("row-level security")) return "No tienes permiso para hacer eso.";
  return message;
}

// ============ Sesión ============

export async function signIn(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: str(fd, "password") });
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/");
}

export async function signUp(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const password = str(fd, "password");
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: str(fd, "email"),
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) {
    if (error.message.toLowerCase().includes("database error")) {
      return { error: "Ese correo no está en la lista de la familia. Pídele a papá o mamá que lo agreguen." };
    }
    return { error: error.message };
  }
  if (!data.session) return { ok: "¡Listo! Revisa tu correo para confirmar tu cuenta y luego entra." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ============ Tareas ============

export async function setTaskStatus(id: string, status: TaskStatus, note?: string): Promise<ActionState> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "regresada" || status === "aprobada") patch.review_note = note || null;
  const { error } = await supabase.from("task_instances").update(patch).eq("id", id);
  return done(error, "Estatus actualizado");
}

export async function returnTask(_: ActionState, fd: FormData): Promise<ActionState> {
  return setTaskStatus(str(fd, "id"), "regresada", str(fd, "note"));
}

export async function saveTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const id = str(fd, "id");
  const recurrence = str(fd, "recurrence");
  const assignees = fd.getAll("assignees").map(String);
  if (!str(fd, "title")) return { error: "Ponle un nombre a la tarea." };
  if (assignees.length === 0) return { error: "Elige al menos a una persona." };
  const weekdays = fd.getAll("weekdays").map(Number);
  if (recurrence === "semanal" && weekdays.length === 0) return { error: "Elige los días de la semana." };
  if (recurrence === "unica" && !str(fd, "due_date")) return { error: "Elige la fecha." };

  const row = {
    title: str(fd, "title"),
    description: str(fd, "description") || null,
    priority: str(fd, "priority") || "normal",
    recurrence,
    weekdays: recurrence === "semanal" ? weekdays : [],
    due_date: recurrence === "unica" ? str(fd, "due_date") : null,
    due_time: str(fd, "due_time") || null,
    assignees,
  };
  const { error } = id
    ? await supabase.from("tasks").update(row).eq("id", id)
    : await supabase.from("tasks").insert(row);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/", "layout");
  redirect("/tareas/gestionar");
}

export async function deactivateTask(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ active: false }).eq("id", id);
  return done(error, "Tarea archivada");
}

export async function deleteTask(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  return done(error, "Tarea borrada");
}

// ============ Trastes ============

export async function addDishEntry(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const kind = str(fd, "kind");
  const qty = Math.max(1, Math.abs(parseInt(str(fd, "qty"), 10) || 1));
  const reason = str(fd, "reason");
  if (!reason) return { error: "Escribe el motivo." };
  const { error } = await supabase.from("dish_entries").insert({
    hija: str(fd, "hija"),
    kind,
    amount: kind === "castigo" ? qty : -qty,
    reason,
  });
  return done(error, "Anotado");
}

export async function reviewDishEntry(id: string, approve: boolean, qty?: number): Promise<ActionState> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    status: approve ? "aprobado" : "rechazado",
    reviewed_at: new Date().toISOString(),
  };
  if (approve && qty !== undefined) {
    const { data } = await supabase.from("dish_entries").select("amount").eq("id", id).single();
    if (data) patch.amount = Math.sign(data.amount) * Math.max(1, Math.abs(qty));
  }
  const { error } = await supabase.from("dish_entries").update(patch).eq("id", id);
  return done(error, approve ? "Aprobado" : "Rechazado");
}

export async function reviewDishForm(_: ActionState, fd: FormData): Promise<ActionState> {
  const qty = parseInt(str(fd, "qty"), 10);
  return reviewDishEntry(str(fd, "id"), str(fd, "decision") === "aprobar", Number.isNaN(qty) ? undefined : qty);
}

export async function deleteDishEntry(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("dish_entries").delete().eq("id", id);
  return done(error, "Borrado");
}

// ============ Deudas ============

export async function addDebtCharge(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const amount = Number(str(fd, "amount"));
  if (!(amount > 0)) return { error: "Escribe un monto mayor a cero." };
  if (!str(fd, "concept")) return { error: "Escribe el concepto." };
  const { error } = await supabase.from("debt_entries").insert({
    hija: str(fd, "hija"),
    kind: str(fd, "kind") || "cargo",
    amount,
    concept: str(fd, "concept"),
    work_date: str(fd, "work_date") || null,
  });
  return done(error, "Guardado");
}

export async function reportBlock(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const amount = Number(str(fd, "amount"));
  const workDate = str(fd, "work_date");
  if (!(amount > 0)) return { error: "Escribe el monto del bloque." };
  if (!workDate) return { error: "Elige la fecha del bloque." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("debt_entries").insert({
    hija: user?.id,
    kind: "abono",
    amount,
    concept: str(fd, "concept") || "Bloque de Amazon",
    work_date: workDate,
  });
  return done(error, "Enviado para revisión");
}

export async function reviewDebtEntry(id: string, approve: boolean): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("debt_entries")
    .update({ status: approve ? "aprobado" : "rechazado", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  return done(error, approve ? "Aprobado" : "Rechazado");
}

export async function deleteDebtEntry(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("debt_entries").delete().eq("id", id);
  return done(error, "Borrado");
}

export async function saveTarifa(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const value = Number(str(fd, "tarifa"));
  if (!(value >= 0)) return { error: "Monto inválido." };
  const { error } = await supabase.from("settings").upsert({ key: "tarifa_bloque", value });
  return done(error, "Tarifa guardada");
}

// ============ Recados ============

export async function addNote(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const body = str(fd, "body");
  if (!body) return { error: "Escribe el recado." };
  const { error } = await supabase.from("notes").insert({ body });
  return done(error, "Recado pegado");
}

export async function toggleNote(id: string, isDone: boolean): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update({ done: isDone }).eq("id", id);
  return done(error, "Listo");
}

export async function deleteNote(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  return done(error, "Recado quitado");
}

// ============ Anuncios ============

export async function addAnnouncement(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const body = str(fd, "body");
  if (!body) return { error: "Escribe el anuncio." };
  const mode = str(fd, "mode");
  const { error } = await supabase.from("announcements").insert({
    body,
    show_time: str(fd, "show_time") || null,
    weekdays: mode === "semanal" ? fd.getAll("weekdays").map(Number) : [],
    on_date: mode === "fecha" ? str(fd, "on_date") || null : null,
  });
  return done(error, "Anuncio publicado");
}

export async function deleteAnnouncement(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  return done(error, "Anuncio borrado");
}

// ============ Familia ============

export async function saveMember(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const email = str(fd, "email").toLowerCase();
  if (!email || !str(fd, "name")) return { error: "Falta correo o nombre." };
  const row = {
    name: str(fd, "name"),
    nickname: str(fd, "nickname") || null,
    role: str(fd, "role") === "admin" ? "admin" : "hija",
    color: str(fd, "color") || "#64748b",
  };
  const { error } = await supabase.from("members").upsert({ email, ...row });
  if (error) return { error: friendly(error.message) };
  // Si ya tenía cuenta, actualiza también su perfil.
  const res = await supabase.from("profiles").update(row).eq("email", email);
  return done(res.error, "Guardado. Si aún no tiene cuenta, ya puede crear su contraseña.");
}

export async function resetPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const password = str(fd, "password");
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  const { error } = await supabase.rpc("admin_set_password", { p_email: str(fd, "email"), p_password: password });
  if (error) return { error: friendly(error.message) };
  return { ok: "Contraseña cambiada. Ya puede entrar con la nueva." };
}
