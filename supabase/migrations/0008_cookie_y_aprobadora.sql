-- 1) Obligaciones Cookie (la perrita): 3 horarios que los papás editan, con quién le toca y qué hacer.
create table public.cookie_shifts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  start_time time not null,
  end_time time not null,
  person_name text,           -- se escribe a mano: no hace falta que la persona tenga cuenta
  tasks text,                 -- un punto por renglón
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cookie_shifts enable row level security;
create policy "familia lee" on public.cookie_shifts for select to authenticated using (true);
create policy "admins todo" on public.cookie_shifts for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.cookie_shifts to authenticated;

insert into public.cookie_shifts (label, start_time, end_time, person_name, position)
select t.label, t.s::time, t.e::time, t.person, t.position
from (values
  ('Mañana', '07:00', '10:00', 'Renata', 0),
  ('Tarde', '14:00', '17:00', 'Rebeka', 1),
  ('Noche', '19:00', '22:00', 'Romina', 2)
) as t (label, s, e, person, position)
where not exists (select 1 from public.cookie_shifts);

-- 2) Guisados: solo la persona marcada como aprobadora (Roxana) acepta o rechaza; los demás proponen.
alter table public.members add column if not exists approves_meals boolean not null default false;
update public.members set approves_meals = true where role = 'admin' and name ilike 'roxana%';

create or replace function public.is_meal_approver()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.members m on lower(m.email) = p.email
    where p.id = auth.uid() and m.approves_meals
  );
$$;

grant execute on function public.is_meal_approver() to authenticated;

create or replace function public.guard_meal_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.proposed_by := auth.uid();
  if public.is_meal_approver() and new.day is not null then
    new.status := 'aceptado';
  else
    new.status := 'propuesto';
  end if;
  return new;
end;
$$;

drop policy if exists "admins editan" on public.meals;
drop policy if exists "admins o quien propuso borran" on public.meals;
create policy "aprobadora edita" on public.meals for update to authenticated
  using (public.is_meal_approver()) with check (public.is_meal_approver());
create policy "aprobadora o quien propuso borran" on public.meals for delete to authenticated
  using (public.is_meal_approver() or (proposed_by = auth.uid() and status = 'propuesto'));

-- Para revisar: debe salir el correo de Roxana.
select name, email from public.members where approves_meals;
