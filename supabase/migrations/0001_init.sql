-- App familiar de tareas: esquema inicial.
-- Todo usuario con sesión puede leer todo (es una familia); los cambios se limitan por rol.

-- ============ Miembros y perfiles ============

-- Lista de correos permitidos. Solo estos correos pueden crear cuenta.
create table public.members (
  email text primary key,
  name text not null,
  nickname text,
  role text not null check (role in ('admin', 'hija')),
  color text not null default '#64748b'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  nickname text,
  role text not null check (role in ('admin', 'hija')),
  color text not null default '#64748b',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Al registrarse, crea el perfil desde la lista de miembros; rechaza correos desconocidos.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.members%rowtype;
begin
  select * into m from public.members where lower(email) = lower(new.email);
  if not found then
    raise exception 'Este correo no está en la lista de la familia';
  end if;
  insert into public.profiles (id, email, name, nickname, role, color)
  values (new.id, lower(new.email), m.name, m.nickname, m.role, m.color);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Tareas ============

-- Plantilla de tarea. Las repetidas generan una "instancia" por día y por hija.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text not null default 'normal' check (priority in ('alta', 'normal', 'baja')),
  recurrence text not null default 'unica' check (recurrence in ('unica', 'diaria', 'semanal')),
  weekdays smallint[] not null default '{}', -- 0 = domingo ... 6 = sábado (semanal)
  due_date date,                             -- para 'unica'
  due_time time,
  assignees uuid[] not null default '{}',
  active boolean not null default true,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  constraint unica_needs_date check (recurrence <> 'unica' or due_date is not null)
);

create table public.task_instances (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  assignee uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  status text not null default 'por_hacer'
    check (status in ('por_hacer', 'en_proceso', 'para_revisar', 'aprobada', 'regresada')),
  review_note text,
  reviewed_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  unique (task_id, assignee, day)
);

create index task_instances_day_idx on public.task_instances (day);
create index task_instances_assignee_idx on public.task_instances (assignee);

-- Crea las instancias que falten para un día (se llama al abrir la app).
create or replace function public.ensure_task_instances(p_day date)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.task_instances (task_id, assignee, day)
  select t.id, a.assignee, p_day
  from public.tasks t
  cross join lateral unnest(t.assignees) as a (assignee)
  where t.active
    and (
      (t.recurrence = 'unica' and t.due_date = p_day)
      or t.recurrence = 'diaria'
      or (t.recurrence = 'semanal' and extract(dow from p_day)::smallint = any (t.weekdays))
    )
    and (t.created_at at time zone 'America/Mexico_City')::date <= p_day
  on conflict (task_id, assignee, day) do nothing;
$$;

-- Las hijas solo pueden mover el estatus de sus propias tareas entre
-- por_hacer, en_proceso y para_revisar. Aprobar o regresar es de los padres.
create or replace function public.guard_task_instance_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if public.is_admin() then
    if new.status in ('aprobada', 'regresada') and new.status is distinct from old.status then
      new.reviewed_by := auth.uid();
    end if;
    return new;
  end if;
  if old.assignee <> auth.uid() then
    raise exception 'Solo puedes cambiar tus propias tareas';
  end if;
  if old.status = 'aprobada' then
    raise exception 'Esta tarea ya fue aprobada';
  end if;
  if new.status not in ('por_hacer', 'en_proceso', 'para_revisar') then
    raise exception 'Solo los papás pueden aprobar o regresar tareas';
  end if;
  if new.task_id <> old.task_id or new.assignee <> old.assignee or new.day <> old.day
     or new.review_note is distinct from old.review_note
     or new.reviewed_by is distinct from old.reviewed_by then
    raise exception 'Solo puedes cambiar el estatus';
  end if;
  return new;
end;
$$;

create trigger task_instances_guard
  before update on public.task_instances
  for each row execute function public.guard_task_instance_update();

-- ============ Trastes (consecuencias) ============

-- Cada movimiento suma (+) o resta (-) tandas. Solo cuentan los aprobados.
create table public.dish_entries (
  id uuid primary key default gen_random_uuid(),
  hija uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount <> 0),
  kind text not null check (kind in ('castigo', 'tarea_extra', 'pagada')),
  reason text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  created_by uuid not null references public.profiles (id) default auth.uid(),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.guard_dish_entry_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  if (new.kind = 'castigo') <> (new.amount > 0) then
    raise exception 'Un castigo suma tandas; tarea extra o tanda pagada restan';
  end if;
  if public.is_admin() then
    new.status := 'aprobado';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  else
    new.status := 'pendiente';
    new.reviewed_by := null;
    new.reviewed_at := null;
    if new.amount < 0 and new.hija <> auth.uid() then
      raise exception 'Solo puedes pedir descuentos para ti';
    end if;
  end if;
  return new;
end;
$$;

create trigger dish_entries_guard
  before insert on public.dish_entries
  for each row execute function public.guard_dish_entry_insert();

-- ============ Deudas y abonos ============

create table public.debt_entries (
  id uuid primary key default gen_random_uuid(),
  hija uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('cargo', 'abono')),
  amount numeric(10, 2) not null check (amount > 0),
  concept text not null,
  work_date date,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  created_by uuid not null references public.profiles (id) default auth.uid(),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.guard_debt_entry_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  if public.is_admin() then
    new.status := 'aprobado';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  else
    if new.kind <> 'abono' or new.hija <> auth.uid() then
      raise exception 'Solo puedes reportar abonos tuyos';
    end if;
    new.status := 'pendiente';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

create trigger debt_entries_guard
  before insert on public.debt_entries
  for each row execute function public.guard_debt_entry_insert();

-- Ajustes sencillos (por ejemplo, la tarifa por bloque de Amazon).
create table public.settings (
  key text primary key,
  value jsonb not null
);

insert into public.settings (key, value) values ('tarifa_bloque', '0');

-- ============ Recados ============

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  done boolean not null default false,
  done_by uuid references public.profiles (id)
);

-- Las hijas solo pueden marcar o desmarcar "Ya quedó".
create or replace function public.guard_note_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.done is distinct from old.done then
    new.done_by := case when new.done then auth.uid() else null end;
  end if;
  if not public.is_admin() and (new.body <> old.body or new.created_by <> old.created_by) then
    raise exception 'Solo puedes marcar el recado como hecho';
  end if;
  return new;
end;
$$;

create trigger notes_guard
  before update on public.notes
  for each row execute function public.guard_note_update();

create or replace function public.force_created_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  return new;
end;
$$;

create trigger notes_created_by
  before insert on public.notes
  for each row execute function public.force_created_by();

-- ============ Anuncios ============

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  show_time text,                            -- "7:00 pm"
  weekdays smallint[] not null default '{}', -- repetido: días en que aparece
  on_date date,                              -- de una vez
  active boolean not null default true,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ============ Permisos (RLS) ============

alter table public.members enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_instances enable row level security;
alter table public.dish_entries enable row level security;
alter table public.debt_entries enable row level security;
alter table public.settings enable row level security;
alter table public.notes enable row level security;
alter table public.announcements enable row level security;

-- Lectura: toda la familia ve todo.
create policy "familia lee" on public.profiles for select to authenticated using (true);
create policy "familia lee" on public.tasks for select to authenticated using (true);
create policy "familia lee" on public.task_instances for select to authenticated using (true);
create policy "familia lee" on public.dish_entries for select to authenticated using (true);
create policy "familia lee" on public.debt_entries for select to authenticated using (true);
create policy "familia lee" on public.settings for select to authenticated using (true);
create policy "familia lee" on public.notes for select to authenticated using (true);
create policy "familia lee" on public.announcements for select to authenticated using (true);
create policy "admins leen" on public.members for select to authenticated using (public.is_admin());

-- Escritura de los papás.
create policy "admins todo" on public.members for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins editan" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins todo" on public.tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins borran" on public.task_instances for delete to authenticated using (public.is_admin());
create policy "admins revisan" on public.dish_entries for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins borran" on public.dish_entries for delete to authenticated using (public.is_admin());
create policy "admins revisan" on public.debt_entries for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins borran" on public.debt_entries for delete to authenticated using (public.is_admin());
create policy "admins todo" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins borran" on public.notes for delete to authenticated using (public.is_admin());
create policy "admins todo" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Escritura de todos (los triggers de arriba limitan lo que cada rol puede hacer).
create policy "familia cambia estatus" on public.task_instances for update to authenticated
  using (public.is_admin() or assignee = auth.uid()) with check (public.is_admin() or assignee = auth.uid());
create policy "familia anota" on public.dish_entries for insert to authenticated with check (true);
create policy "familia abona" on public.debt_entries for insert to authenticated with check (true);
create policy "familia pega recados" on public.notes for insert to authenticated with check (true);
create policy "familia marca recados" on public.notes for update to authenticated using (true) with check (true);

grant execute on function public.ensure_task_instances(date) to authenticated;
revoke execute on function public.ensure_task_instances(date) from anon, public;
