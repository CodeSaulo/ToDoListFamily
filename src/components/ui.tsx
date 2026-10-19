import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Priority, Profile, ReviewStatus, TaskStatus } from "@/lib/types";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/types";

export function Card({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-extrabold text-slate-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  blue: "from-sky-400 to-blue-600",
  pink: "from-pink-400 to-fuchsia-600",
  violet: "from-violet-400 to-indigo-600",
  orange: "from-amber-400 to-orange-500",
  green: "from-emerald-400 to-teal-600",
  yellow: "from-yellow-300 to-amber-500",
} as const;

export type Tone = keyof typeof TONES;

/** Ícono dentro de un cuadrito redondeado con degradado. */
export function IconTile({ icon: Icon, tone = "blue", size = 36 }: { icon: LucideIcon; tone?: Tone; size?: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${TONES[tone]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.55} strokeWidth={2.25} />
    </span>
  );
}

export function PageTitle({ children, sub, icon, tone }: { children: ReactNode; sub?: ReactNode; icon?: LucideIcon; tone?: Tone }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      {icon && <IconTile icon={icon} tone={tone} size={44} />}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{children}</h1>
        {sub && <p className="text-sm text-slate-500 first-letter:uppercase">{sub}</p>}
      </div>
    </header>
  );
}

/** Título de tarjeta con ícono. */
export function IconTitle({ icon: Icon, children, className = "text-brand-600" }: { icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon size={18} strokeWidth={2.5} className={className} />
      {children}
    </span>
  );
}

export function Avatar({ p, size = 28 }: { p?: Profile; size?: number }) {
  const label = (p?.nickname || p?.name || "?").slice(0, 1).toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ background: p?.color ?? "#94a3b8", width: size, height: size, fontSize: size * 0.45 }}
      title={p?.name}
    >
      {label}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  alta: "bg-rose-100 text-rose-700",
  normal: "bg-amber-100 text-amber-800",
  baja: "bg-slate-100 text-slate-600",
};

export function PriorityBadge({ p }: { p: Priority }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_STYLE[p]}`}>{PRIORITY_LABEL[p]}</span>;
}

const STATUS_STYLE: Record<TaskStatus | "atrasada", string> = {
  por_hacer: "bg-slate-100 text-slate-700",
  en_proceso: "bg-sky-100 text-sky-800",
  para_revisar: "bg-violet-100 text-violet-800",
  aprobada: "bg-emerald-100 text-emerald-800",
  regresada: "bg-orange-100 text-orange-800",
  atrasada: "bg-rose-600 text-white",
};

export function StatusBadge({ s, late }: { s: TaskStatus; late?: boolean }) {
  return (
    <span className="inline-flex gap-1">
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[s]}`}>{STATUS_LABEL[s]}</span>
      {late && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE.atrasada}`}>Atrasada</span>}
    </span>
  );
}

const REVIEW_STYLE: Record<ReviewStatus, string> = {
  pendiente: "bg-violet-100 text-violet-800",
  aprobado: "bg-emerald-100 text-emerald-800",
  rechazado: "bg-slate-200 text-slate-500 line-through",
};

export function ReviewBadge({ s }: { s: ReviewStatus }) {
  const label = { pendiente: "Por revisar", aprobado: "Aprobado", rechazado: "Rechazado" }[s];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${REVIEW_STYLE[s]}`}>{label}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-3 text-center text-sm text-slate-400">{children}</p>;
}
