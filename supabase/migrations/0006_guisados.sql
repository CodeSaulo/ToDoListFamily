-- Lista de guisados: cualquiera propone, los papás aceptan y los acomodan en el calendario.
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  status text not null default 'propuesto' check (status in ('propuesto', 'aceptado', 'rechazado')),
  day date,
  slot text not null default 'comida' check (slot in ('desayuno', 'comida', 'cena')),
  proposed_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index meals_day_idx on public.meals (day);

-- Las hijas solo proponen; aceptar y poner fecha es de los papás.
create or replace function public.guard_meal_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.proposed_by := auth.uid();
  if not public.is_admin() then
    new.status := 'propuesto';
  elsif new.day is not null and new.status = 'propuesto' then
    new.status := 'aceptado';
  end if;
  return new;
end;
$$;

create trigger meals_guard
  before insert on public.meals
  for each row execute function public.guard_meal_insert();

alter table public.meals enable row level security;
create policy "familia lee" on public.meals for select to authenticated using (true);
create policy "familia propone" on public.meals for insert to authenticated with check (true);
create policy "admins editan" on public.meals for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins o quien propuso borran" on public.meals for delete to authenticated
  using (public.is_admin() or (proposed_by = auth.uid() and status = 'propuesto'));

grant select, insert, update, delete on public.meals to authenticated;
