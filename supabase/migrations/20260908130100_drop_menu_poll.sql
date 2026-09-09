-- Remove a votação de cardápio.
--
-- O produto trocou a enquete por uma exibição simples: o anfitrião escreve os
-- pratos e as bebidas no editor, o convidado só lê. Sem voto, sem apuração,
-- sem token — as três tabelas, as funções `security definer` e a RLS delas
-- deixam de ter uso. O conteúdo novo entra em
-- `20260908130200_menu_bar_content.sql`.

drop function if exists public.get_menu_polls_publicos(text);
drop function if exists public.get_menu_votes_by_token(text);
drop function if exists public.submit_menu_vote(text, uuid, uuid[]);

-- `cascade` leva junto índices, triggers, políticas e as FKs entre elas.
drop table if exists public.menu_votes cascade;
drop table if exists public.menu_options cascade;
drop table if exists public.menu_polls cascade;
