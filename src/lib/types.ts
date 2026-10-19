export type Role = "admin" | "hija";

export type Profile = {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  role: Role;
  color: string;
};

export type Priority = "alta" | "normal" | "baja";
export type Recurrence = "unica" | "diaria" | "semanal";
export type TaskStatus = "por_hacer" | "en_proceso" | "para_revisar" | "aprobada" | "regresada";
export type ReviewStatus = "pendiente" | "aprobado" | "rechazado";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  recurrence: Recurrence;
  weekdays: number[];
  due_date: string | null;
  due_time: string | null;
  assignees: string[];
  active: boolean;
};

export type TaskInstance = {
  id: string;
  task_id: string;
  assignee: string;
  day: string;
  status: TaskStatus;
  review_note: string | null;
  task: Task;
};

export type DishEntry = {
  id: string;
  hija: string;
  amount: number;
  kind: "castigo" | "tarea_extra" | "pagada";
  reason: string;
  status: ReviewStatus;
  created_by: string;
  created_at: string;
};

export type DebtEntry = {
  id: string;
  hija: string;
  kind: "cargo" | "abono";
  amount: number;
  concept: string;
  work_date: string | null;
  status: ReviewStatus;
  created_by: string;
  created_at: string;
};

export type Note = {
  id: string;
  body: string;
  created_by: string;
  created_at: string;
  done: boolean;
  done_by: string | null;
};

export type Announcement = {
  id: string;
  body: string;
  show_time: string | null;
  weekdays: number[];
  on_date: string | null;
  active: boolean;
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  por_hacer: "Por hacer",
  en_proceso: "En proceso",
  para_revisar: "Para revisar",
  aprobada: "Aprobada",
  regresada: "Regresada",
};

export const PRIORITY_LABEL: Record<Priority, string> = { alta: "Alta", normal: "Normal", baja: "Baja" };

export const DISH_KIND_LABEL: Record<DishEntry["kind"], string> = {
  castigo: "Castigo",
  tarea_extra: "Tarea extra",
  pagada: "Lavó una tanda",
};

export type Obligation = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  active: boolean;
};
