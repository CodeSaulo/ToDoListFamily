import { KeyRound, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { resetPassword, saveMember } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, IconTitle, PageTitle } from "@/components/ui";
import { getSession } from "@/lib/data";

type Member = { email: string; name: string; nickname: string | null; role: string; color: string };

export default async function FamiliaPage() {
  const { supabase, isAdmin, profiles } = await getSession();
  if (!isAdmin) redirect("/");
  const { data } = await supabase.from("members").select("*").order("role");
  const members = (data ?? []) as Member[];
  const registered = new Set(profiles.map((p) => p.email));

  return (
    <div className="space-y-4">
      <PageTitle sub="Solo estos correos pueden crear cuenta" icon={Users} tone="pink">Familia</PageTitle>
      <Card>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.email} className="flex items-center gap-3 py-2">
              <span className="h-6 w-6 rounded-full" style={{ background: m.color }} />
              <div className="flex-1">
                <p className="font-bold">
                  {m.name} {m.nickname && <span className="text-slate-400">({m.nickname})</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {m.email} · {m.role === "admin" ? "Papá/Mamá" : "Hija"}
                </p>
              </div>
              <span className={`text-xs font-bold ${registered.has(m.email) ? "text-emerald-600" : "text-slate-400"}`}>
                {registered.has(m.email) ? "Ya entró" : "Sin cuenta"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={<IconTitle icon={KeyRound}>Cambiar contraseña</IconTitle>}>
        <p className="mb-3 text-sm text-slate-500">Si a alguien se le olvidó, ponle una nueva aquí y díselo para que entre.</p>
        <ActionForm action={resetPassword}>
          <select name="email" className="input">
            {members
              .filter((m) => registered.has(m.email))
              .map((m) => (
                <option key={m.email} value={m.email}>
                  {m.nickname || m.name}
                </option>
              ))}
          </select>
          <input name="password" type="text" autoComplete="off" minLength={6} className="input" placeholder="Contraseña nueva (6 o más)" />
          <SubmitButton className="btn-primary w-full">Cambiar contraseña</SubmitButton>
        </ActionForm>
      </Card>
      <Card title="Agregar o corregir">
        <ActionForm action={saveMember}>
          <input name="email" type="email" className="input" placeholder="correo@ejemplo.com" />
          <div className="grid grid-cols-2 gap-2">
            <input name="name" className="input" placeholder="Nombre" />
            <input name="nickname" className="input" placeholder="Apodo (opcional)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="role" className="input">
              <option value="hija">Hija</option>
              <option value="admin">Papá/Mamá</option>
            </select>
            <input name="color" type="color" defaultValue="#8b5cf6" className="input !h-11 !p-1" />
          </div>
          <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
