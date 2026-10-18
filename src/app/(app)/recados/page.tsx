import { addNote, deleteNote, toggleNote } from "@/app/actions";
import { ActButton, ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Card, Empty, PageTitle } from "@/components/ui";
import { displayName, getSession } from "@/lib/data";
import { formatShort } from "@/lib/dates";
import type { Note } from "@/lib/types";

export default async function RecadosPage() {
  const { supabase, isAdmin, byId } = await getSession();
  const { data } = await supabase.from("notes").select("*").order("done").order("created_at", { ascending: false });
  const notes = (data ?? []) as Note[];

  return (
    <div className="space-y-4">
      <PageTitle sub="Pendientes y cosas que no hay que olvidar">Recados 📌</PageTitle>

      <Card>
        <ActionForm action={addNote} className="flex gap-2">
          <input name="body" className="input" placeholder="Ej. Ir a la papelería por cartulina" />
          <SubmitButton>Pegar</SubmitButton>
        </ActionForm>
      </Card>

      {notes.length === 0 ? (
        <Empty>No hay recados.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 shadow-sm ${n.done ? "bg-slate-100 text-slate-400" : "bg-yellow-100"}`}
            >
              <p className={`font-bold ${n.done ? "line-through" : ""}`}>{n.body}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Avatar p={byId.get(n.created_by)} size={18} />
                {displayName(byId.get(n.created_by))} · {formatShort(n.created_at)}
              </div>
              {n.done && <p className="mt-1 text-xs">✓ Lo hizo {displayName(byId.get(n.done_by ?? ""))}</p>}
              <div className="mt-3 flex gap-2">
                <ActButton action={toggleNote.bind(null, n.id, !n.done)} className="btn-soft !bg-white/70">
                  {n.done ? "Desmarcar" : "✓ Ya quedó"}
                </ActButton>
                {isAdmin && (
                  <ActButton action={deleteNote.bind(null, n.id)} className="btn-red" confirm="¿Quitar este recado?">
                    Quitar
                  </ActButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
