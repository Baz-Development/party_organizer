-- Ordem personalizada das seções da página pública de cada evento.
--
-- Lista de `module_id` na ordem em que o anfitrião quer ver as seções.
-- `null` = ordem padrão do app. Módulos que não estiverem na lista (por
-- exemplo, ligados depois de a ordem ser salva) caem no fim, na ordem padrão —
-- quem completa a lista é o app, não o banco.

alter table public.events
  add column section_order public.module_id[];
