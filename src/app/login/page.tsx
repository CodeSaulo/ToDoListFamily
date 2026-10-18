import { signIn, signUp } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/forms";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <img src="/icon.svg" alt="" className="mx-auto mb-3 h-16 w-16" />
        <h1 className="text-2xl font-extrabold">Tareas en Familia</h1>
        <p className="text-sm text-slate-500">Entra con tu correo</p>
      </div>
      {error === "sin-perfil" && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tu cuenta existe pero no está en la lista de la familia. Pídele a papá o mamá que te agreguen.
        </p>
      )}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <ActionForm action={signIn} resetOnOk={false}>
          <div>
            <label className="label" htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          <SubmitButton className="btn-primary w-full">Entrar</SubmitButton>
        </ActionForm>
      </div>
      <details className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <summary className="cursor-pointer text-sm font-bold text-brand-700">¿Primera vez? Crea tu contraseña</summary>
        <ActionForm action={signUp} className="mt-3 space-y-3" resetOnOk={false}>
          <input name="email" type="email" placeholder="Tu correo" autoComplete="email" required className="input" />
          <input name="password" type="password" placeholder="Nueva contraseña (6+)" autoComplete="new-password" required className="input" />
          <SubmitButton className="btn-soft w-full">Crear mi cuenta</SubmitButton>
        </ActionForm>
      </details>
    </main>
  );
}
