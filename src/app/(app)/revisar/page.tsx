import { redirect } from "next/navigation";
import { DebtReview, DishReview } from "@/components/ReviewButtons";
import { TaskCard } from "@/components/TaskCard";
import { Avatar, Card, Empty, PageTitle } from "@/components/ui";
import { displayName, getDebtEntries, getDishEntries, getSession, money } from "@/lib/data";
import { formatDate, todayMX } from "@/lib/dates";
import { DISH_KIND_LABEL, type TaskInstance } from "@/lib/types";

export default async function RevisarPage() {
  const { supabase, me, isAdmin, byId } = await getSession();
  if (!isAdmin) redirect("/");
  const today = todayMX();
  const [tasksRes, dishes, debts] = await Promise.all([
    supabase.from("task_instances").select("*, task:tasks(*)").eq("status", "para_revisar").order("day"),
    getDishEntries(),
    getDebtEntries(),
  ]);
  const tasks = (tasksRes.data ?? []) as TaskInstance[];
  const pendingDishes = dishes.filter((d) => d.status === "pendiente");
  const pendingDebts = debts.filter((d) => d.status === "pendiente");

  return (
    <div className="space-y-4">
      <PageTitle sub="Den el visto bueno">Por revisar</PageTitle>

      <Card title={`Tareas (${tasks.length})`}>
        {tasks.length === 0 ? (
          <Empty>Nada por revisar.</Empty>
        ) : (
          <div className="space-y-2">
            {tasks.map((i) => (
              <TaskCard key={i.id} inst={i} me={me} byId={byId} today={today} />
            ))}
          </div>
        )}
      </Card>

      <Card title={`Trastes (${pendingDishes.length})`}>
        {pendingDishes.length === 0 ? (
          <Empty>Nada por revisar.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pendingDishes.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-center gap-2">
                  <Avatar p={byId.get(e.hija)} />
                  <p className="font-bold">
                    {displayName(byId.get(e.hija))}{" "}
                    <span className={e.amount > 0 ? "text-rose-600" : "text-emerald-600"}>{e.amount > 0 ? `+${e.amount}` : e.amount}</span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {DISH_KIND_LABEL[e.kind]}: {e.reason} · lo anotó {displayName(byId.get(e.created_by))}
                </p>
                <DishReview e={e} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Abonos (${pendingDebts.length})`}>
        {pendingDebts.length === 0 ? (
          <Empty>Nada por revisar.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pendingDebts.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-center gap-2">
                  <Avatar p={byId.get(e.hija)} />
                  <p className="font-bold">
                    {displayName(byId.get(e.hija))} <span className="text-emerald-600">−{money(Number(e.amount))}</span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {e.concept}
                  {e.work_date && ` · ${formatDate(e.work_date)}`}
                </p>
                <DebtReview e={e} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
