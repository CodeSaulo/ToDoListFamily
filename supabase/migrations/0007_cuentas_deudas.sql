-- Cuentas de deuda separadas por persona (Tatis, Rebe, Romi, Mamis, ...).
-- Cada hija tiene su cuenta ligada a su usuario; los papás pueden crear otras cuentas sin usuario.
create table public.debt_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profile_id uuid unique references public.profiles (id) on delete cascade,
  color text not null default '#64748b',
  created_at timestamptz not null default now()
);

alter table public.debt_accounts enable row level security;
create policy "familia lee" on public.debt_accounts for select to authenticated using (true);
create policy "admins todo" on public.debt_accounts for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.debt_accounts to authenticated;

-- Una cuenta para cada hija que ya existe, y para las que entren después.
insert into public.debt_accounts (name, profile_id, color)
select coalesce(p.nickname, p.name), p.id, p.color
from public.profiles p
where p.role = 'hija'
on conflict (profile_id) do nothing;

create or replace function public.create_debt_account_for_hija()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'hija' then
    insert into public.debt_accounts (name, profile_id, color)
    values (coalesce(new.nickname, new.name), new.id, new.color)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger profiles_debt_account
  after insert on public.profiles
  for each row execute function public.create_debt_account_for_hija();

-- Los movimientos ahora pertenecen a una cuenta; "hija" queda solo para las cuentas con usuario.
alter table public.debt_entries add column if not exists account_id uuid references public.debt_accounts (id) on delete cascade;

update public.debt_entries e
   set account_id = a.id
  from public.debt_accounts a
 where a.profile_id = e.hija and e.account_id is null;

alter table public.debt_entries alter column hija drop not null;
alter table public.debt_entries alter column account_id set not null;

create or replace function public.guard_debt_entry_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  acc public.debt_accounts%rowtype;
begin
  new.created_by := auth.uid();
  -- Encontrar la cuenta (por cuenta o, si no viene, por la hija).
  if new.account_id is null and new.hija is not null then
    select * into acc from public.debt_accounts where profile_id = new.hija;
  else
    select * into acc from public.debt_accounts where id = new.account_id;
  end if;
  if not found then
    raise exception 'Esa cuenta no existe';
  end if;
  new.account_id := acc.id;
  new.hija := acc.profile_id;

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
    if new.kind <> 'abono' or new.hija is distinct from auth.uid() then
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
