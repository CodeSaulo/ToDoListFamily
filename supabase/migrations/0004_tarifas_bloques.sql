-- Tarifas fijas por bloque de Amazon: 2 horas = $30, 3 horas o más = $40.
-- El monto lo pone la base de datos según el tipo de bloque; nadie lo puede cambiar a mano.
alter table public.debt_entries
  add column if not exists block_hours smallint check (block_hours in (2, 3));

create or replace function public.block_rate(p_hours smallint)
returns numeric
language sql
immutable
as $$
  select case when p_hours = 2 then 30 when p_hours >= 3 then 40 end::numeric;
$$;

create or replace function public.guard_debt_entry_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  if new.block_hours is not null then
    if new.kind <> 'abono' then
      raise exception 'Un bloque solo puede ser abono';
    end if;
    new.amount := public.block_rate(new.block_hours);
  end if;
  if public.is_admin() then
    new.status := 'aprobado';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  else
    if new.kind <> 'abono' or new.hija <> auth.uid() then
      raise exception 'Solo puedes reportar abonos tuyos';
    end if;
    if new.block_hours is null then
      raise exception 'Elige si el bloque fue de 2 horas o de 3 horas o más';
    end if;
    new.status := 'pendiente';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

-- Al aprobar o editar, el monto de un bloque tampoco se puede cambiar.
create or replace function public.guard_debt_entry_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.block_hours is not null then
    new.amount := public.block_rate(new.block_hours);
  end if;
  return new;
end;
$$;

drop trigger if exists debt_entries_guard_update on public.debt_entries;
create trigger debt_entries_guard_update
  before update on public.debt_entries
  for each row execute function public.guard_debt_entry_update();
