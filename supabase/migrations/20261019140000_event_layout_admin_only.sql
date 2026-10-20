-- Estrutura e identidade visual da página passam a ser só do admin.
--
-- A Equipe ALF Eventos monta a página: escolhe as seções ativas
-- (`event_modules`) e as cores (`theme_key`, `accent_color`,
-- `accent_text_color`, `background_color`). A anfitriã continua editando o
-- conteúdo — textos, capa, cronograma, cardápio, bar, amigo secreto, prazo
-- de RSVP e moderação — mas não liga/desliga módulos nem troca as cores.
--
-- O editor já esconde esses controles e a server action já os descarta para
-- quem não é admin; aqui fica a garantia para quem falar direto com a API.

drop policy event_modules_insert on public.event_modules;
drop policy event_modules_delete on public.event_modules;

create policy event_modules_insert on public.event_modules
for insert to authenticated
with check (public.is_platform_admin());

create policy event_modules_delete on public.event_modules
for delete to authenticated
using (public.is_platform_admin());

-- Colunas de cor: a RLS de `events` é por linha, então a trava por coluna vai
-- num trigger. Sem `auth.uid()` (service role, migrations, seed) passa direto.
create function public._events_guard_layout()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
    and not public.is_platform_admin()
    and (
      new.theme_key is distinct from old.theme_key
      or new.accent_color is distinct from old.accent_color
      or new.accent_text_color is distinct from old.accent_text_color
      or new.background_color is distinct from old.background_color
    )
  then
    raise exception 'layout_somente_admin' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger events_guard_layout
before update of theme_key, accent_color, accent_text_color, background_color
on public.events
for each row
execute function public._events_guard_layout();
