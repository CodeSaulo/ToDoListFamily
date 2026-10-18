"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/tareas", label: "Tareas", icon: "✅" },
  { href: "/trastes", label: "Trastes", icon: "🍽️" },
  { href: "/deudas", label: "Deudas", icon: "💰" },
  { href: "/recados", label: "Recados", icon: "📌" },
];

export function Nav({ pending }: { pending: number }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <ul className="mx-auto flex max-w-3xl justify-around">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold md:flex-row md:justify-center md:gap-2 md:py-3 md:text-sm ${active ? "text-brand-700" : "text-slate-500"}`}
              >
                <span className="text-xl md:text-base">{it.icon}</span>
                {it.label}
                {it.href === "/" && pending > 0 && (
                  <span className="absolute top-1 right-[calc(50%-22px)] rounded-full bg-rose-600 px-1.5 text-[10px] text-white md:static">
                    {pending}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
