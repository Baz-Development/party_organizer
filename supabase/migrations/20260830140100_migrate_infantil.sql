-- `infantil` sai de uso: a ata ALF Eventos não o lista. Eventos existentes
-- desse tipo passam a `aniversario`. O valor `infantil` permanece no enum
-- (Postgres não remove valor de enum), mas a validação Zod e o seletor de
-- tipo em /admin deixam de ofertá-lo.

update public.events set kind = 'aniversario' where kind = 'infantil';
