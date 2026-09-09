-- Endereço e CEP do evento, para a seção "Local e mapa" da página pública.
--
-- Campo único por evento — vai para colunas de `events`, como o serviço de bar
-- e o amigo secreto (20260908130200_menu_bar_content.sql). `venue`/`city` já
-- existem e continuam sendo o texto exibido; `address`/`postal_code` alimentam
-- o mapa (Google Maps) e o link de rota.

alter table public.events
  add column address     text,
  add column postal_code text;
