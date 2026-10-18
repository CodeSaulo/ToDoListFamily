"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";

export function SubmitButton({ children, className = "btn-primary", name, value }: { children: ReactNode; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? "…" : children}
    </button>
  );
}

/** Formulario que muestra el error o el aviso de éxito que devuelve la acción. */
export function ActionForm({
  action,
  children,
  className = "space-y-3",
  resetOnOk = true,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnOk?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <Feedback state={state} />
    </form>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (state?.error) return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{state.ok}</p>;
  return null;
}

/** Botón que ejecuta una acción del servidor sin formulario. */
export function ActButton({
  action,
  children,
  className = "btn-soft",
  confirm,
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const res = await action();
            setError(res?.error);
          });
        }}
      >
        {pending ? "…" : children}
      </button>
      {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
    </>
  );
}

/** Muestra u oculta un bloque (por ejemplo, un formulario). */
export function Toggle({ label, children, className = "btn-primary" }: { label: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className={className} onClick={() => setOpen((o) => !o)}>
        {open ? "Cerrar" : label}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
