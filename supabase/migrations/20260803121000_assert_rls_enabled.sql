-- Revisão tabela por tabela — automatizada.
--
-- Esquecer `enable row level security` numa tabela nova é o erro que vaza
-- dados entre organizações, e é silencioso: a tabela simplesmente responde a
-- todo mundo. Em vez de confiar em revisão manual a cada change de módulo,
-- esta migration falha se qualquer tabela do schema public estiver sem RLS.
--
-- Se um change futuro quebrar aqui, a correção é habilitar a RLS e escrever as
-- políticas da tabela nova — não remover esta checagem.

do $$
declare
  desprotegidas text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
  into desprotegidas
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity;

  if desprotegidas is not null then
    raise exception
      'Tabelas sem row level security no schema public: %', desprotegidas;
  end if;
end;
$$;
