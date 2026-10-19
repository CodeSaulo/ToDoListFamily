-- Permite a los papás ponerle una contraseña nueva a cualquier miembro de la familia
-- (por si a alguien se le olvida). Solo funciona para correos de la lista de la familia.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_set_password(p_email text, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo los papás pueden cambiar contraseñas';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;
  if not exists (select 1 from public.members where lower(email) = lower(p_email)) then
    raise exception 'Ese correo no está en la lista de la familia';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where lower(email) = lower(p_email);
  if not found then
    raise exception 'Esa persona todavía no ha creado su cuenta';
  end if;
end;
$$;

revoke execute on function public.admin_set_password(text, text) from anon, public;
grant execute on function public.admin_set_password(text, text) to authenticated;
