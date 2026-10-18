import { notFound, redirect } from "next/navigation";
import { TaskForm } from "@/components/TaskForm";
import { Card, PageTitle } from "@/components/ui";
import { getSession } from "@/lib/data";
import type { Task } from "@/lib/types";

export default async function EditarTarea({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, isAdmin, hijas } = await getSession();
  if (!isAdmin) redirect("/tareas");
  const { id } = await params;
  const { data } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <PageTitle>Editar tarea</PageTitle>
      <Card>
        <TaskForm task={data as Task} people={hijas} />
      </Card>
    </div>
  );
}
