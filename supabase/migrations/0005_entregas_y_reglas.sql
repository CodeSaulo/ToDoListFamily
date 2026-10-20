-- Entrega semanal de obligaciones y reglas de qué incluye cada una.

-- Qué incluye hacer la obligación y qué incluye entregarla (un punto por renglón).
alter table public.obligations
  add column if not exists includes text,
  add column if not exists handover_rules text;

-- Una fila por obligación y semana (week_start = lunes) cuando alguien marca la entrega.
create table public.obligation_handovers (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.obligations (id) on delete cascade,
  week_start date not null,
  hija uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('por_revisar', 'entregada', 'no_entregada')),
  marked_by uuid references public.profiles (id) default auth.uid(),
  updated_at timestamptz not null default now(),
  unique (obligation_id, week_start)
);

-- La hija solo puede avisar "ya la entregué" (queda por revisar); los papás deciden.
create or replace function public.guard_handover()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.marked_by := auth.uid();
  new.updated_at := now();
  if public.is_admin() then
    return new;
  end if;
  if new.hija <> auth.uid() then
    raise exception 'Solo puedes avisar de tus propias entregas';
  end if;
  if tg_op = 'UPDATE' and old.status = 'entregada' then
    raise exception 'Esta entrega ya fue aprobada';
  end if;
  new.status := 'por_revisar';
  return new;
end;
$$;

create trigger obligation_handovers_guard
  before insert or update on public.obligation_handovers
  for each row execute function public.guard_handover();

alter table public.obligation_handovers enable row level security;
create policy "familia lee" on public.obligation_handovers for select to authenticated using (true);
create policy "familia avisa" on public.obligation_handovers for insert to authenticated
  with check (public.is_admin() or hija = auth.uid());
create policy "familia actualiza" on public.obligation_handovers for update to authenticated
  using (public.is_admin() or hija = auth.uid()) with check (public.is_admin() or hija = auth.uid());
create policy "admins borran" on public.obligation_handovers for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.obligation_handovers to authenticated;

-- Reglas generales (texto libre que editan los papás).
insert into public.settings (key, value) values ('reglas_generales', '""') on conflict (key) do nothing;

-- Las tres obligaciones de la casa, solo si todavía no hay ninguna.
insert into public.obligations (title, position)
select t.title, t.position
from (values ('Baño', 0), ('Barra', 1), ('Sala', 2)) as t (title, position)
where not exists (select 1 from public.obligations);
