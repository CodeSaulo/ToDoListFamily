import { Nav } from "@/components/Nav";
import { getSession } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, isAdmin } = await getSession();
  let pending = 0;
  if (isAdmin) {
    const [t, d, m] = await Promise.all([
      supabase.from("task_instances").select("id", { count: "exact", head: true }).eq("status", "para_revisar"),
      supabase.from("dish_entries").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
      supabase.from("debt_entries").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    ]);
    pending = (t.count ?? 0) + (d.count ?? 0) + (m.count ?? 0);
  }
  return (
    <>
      <Nav pending={pending} />
      <main className="mx-auto max-w-3xl px-4 pt-5 pb-28 md:pb-10">{children}</main>
    </>
  );
}
