-- Auto-cadastro por link dedicado substitui a flag `guest_list_open`.
--
-- Antes: `events.guest_list_open` ligava/desligava o RSVP de quem não estava na
-- lista, e qualquer visitante da URL nua do evento caía nesse fluxo. Agora o
-- anfitrião gera um token opaco e compartilha o link `?lista=<token>`; sem esse
-- token (e sem token de convidado) ninguém responde.
--
-- `pgcrypto` já declarado em `20260803130100_guest_invites.sql`, no schema
-- `extensions`. Chamada qualificada para não depender do `search_path`.

alter table public.events
  add column self_signup_token text unique;

-- Migração de dados: quem tinha lista aberta ganha um token já ativo; os demais
-- ficam com auto-cadastro desligado (`null`).
update public.events
set self_signup_token = encode(extensions.gen_random_bytes(32), 'hex')
where guest_list_open = true;

alter table public.events
  drop column guest_list_open;
