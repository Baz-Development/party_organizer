-- Módulo `sorteios`: sorteio de prêmios entre convidados, conduzido pela
-- anfitriã numa tela de apresentação. Só existe no painel — não tem seção na
-- página pública.
--
-- Igual a `20260908130000_module_id_bar.sql`: `alter type ... add value` fica
-- sozinho na migration, para o valor novo já estar commitado quando as
-- tabelas e funções seguintes o referenciarem.

alter type public.module_id add value if not exists 'sorteios';
