-- Obligaciones fijas que se van turnando entre las hijas cada semana (lunes a domingo).
create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.obligations enable row level security;
create policy "familia lee" on public.obligations for select to authenticated using (true);
create policy "admins todo" on public.obligations for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Cuántas semanas se ha recorrido el rol a mano (los papás lo pueden ajustar).
insert into public.settings (key, value) values ('rotacion_offset', '0') on conflict (key) do nothing;
