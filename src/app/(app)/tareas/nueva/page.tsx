import { redirect } from "next/navigation";
import { TaskForm } from "@/components/TaskForm";
import { Card, PageTitle } from "@/components/ui";
import { getSession } from "@/lib/data";

export default async function NuevaTarea() {
  const { isAdmin, hijas } = await getSession();
  if (!isAdmin) redirect("/tareas");
  return (
    <div>
      <PageTitle>Nueva tarea</PageTitle>
      <Card>
        <TaskForm people={hijas} />
      </Card>
    </div>
  );
}
