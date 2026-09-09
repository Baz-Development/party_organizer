-- Amigo secreto configurável por evento.
--
-- `SECRET_SANTA_CONFIG` (`src/lib/fixtures/secret-santa.ts`) era fixo pra todo
-- mundo: mesmo valor sugerido e mesmas datas em qualquer evento. Vira coluna
-- do próprio evento, editável pelo anfitrião junto do resto do conteúdo —
-- igual `rsvp_deadline`. Todo nullable: o módulo funciona sem nenhum
-- configurado, só sem a sugestão aparecer para o convidado.

alter table public.events
  add column secret_santa_budget text,
  add column secret_santa_draw_date date,
  add column secret_santa_exchange_date date,
  add column secret_santa_rules text;
