-- Permissões de tabela para os papéis da Data API.
--
-- RLS e GRANT são camadas diferentes e as duas precisam liberar: a política
-- diz *quais linhas*, o grant diz *se a tabela é alcançável*. O Supabase não
-- concede grant automático para tabelas novas no schema public (é o padrão da
-- nuvem hoje), então sem esta migration toda consulta pela API responde
-- "permission denied", mesmo com as políticas certas.
--
-- Regra: `anon` só lê o que é público; `authenticated` escreve onde a RLS
-- permitir; `service_role` faz tudo, porque já ignora RLS por natureza.
-- Toda tabela nova de módulo precisa repetir isto.

-- Perfis: sem insert (quem cria é o trigger on_auth_user_created) e sem
-- delete (o perfil morre junto com auth.users, por cascade).
grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;

-- O convidado sem conta precisa ler evento, módulos e cronograma; a RLS
-- limita ao que está publicado.
grant select on public.events to anon, authenticated;
grant select on public.event_modules to anon, authenticated;
grant select on public.schedule_items to anon, authenticated;

grant insert, update, delete on public.events to authenticated;
-- Módulo habilitado é um par (evento, módulo): liga e desliga, não atualiza.
grant insert, delete on public.event_modules to authenticated;
grant insert, update, delete on public.schedule_items to authenticated;

grant all on all tables in schema public to service_role;
