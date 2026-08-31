-- Catálogo de tipos de evento alinhado à ata Villa Glam (seção 2):
-- casamento, debutante, corporativo, aniversário, formatura, confraternização,
-- outros. Faltavam `aniversario`, `confraternizacao` e `outros`.
--
-- `alter type ... add value` não roda no mesmo bloco transacional que outra
-- DDL/DML em algumas versões do Postgres — esta migration faz só isso; a
-- migração dos eventos `infantil` fica no arquivo seguinte, com o valor novo
-- já commitado.

alter type public.event_kind add value if not exists 'aniversario';
alter type public.event_kind add value if not exists 'confraternizacao';
alter type public.event_kind add value if not exists 'outros';
