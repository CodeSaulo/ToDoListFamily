export const TZ = "America/Mexico_City";

export const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Fecha de hoy en México como "YYYY-MM-DD". */
export function todayMX(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

export function formatDay(day: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

export function formatShort(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatDate(day: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );
}

/** Lunes de la semana de `day`. */
export function mondayOf(day: string): string {
  const dow = weekdayOf(day);
  return addDays(day, dow === 0 ? -6 : 1 - dow);
}

/** Semanas completas desde el lunes 5 de enero de 2026 (referencia fija del rol). */
export function weekNumber(day: string): number {
  const ms = new Date(`${mondayOf(day)}T12:00:00Z`).getTime() - new Date("2026-01-05T12:00:00Z").getTime();
  return Math.round(ms / (7 * 86400000));
}
