-- Rebeca se escribe con K: Rebeka.
update public.members set name = 'Rebeka' where name = 'Rebeca';
update public.profiles set name = 'Rebeka' where name = 'Rebeca';

do $$
begin
  if to_regclass('public.debt_accounts') is not null then
    update public.debt_accounts set name = 'Rebeka' where name = 'Rebeca';
  end if;
  if to_regclass('public.cookie_shifts') is not null then
    update public.cookie_shifts set person_name = 'Rebeka' where person_name = 'Rebeca';
  end if;
end $$;

-- Para revisar: debe salir Rebeka.
select name, nickname from public.members where role = 'hija' order by name;
