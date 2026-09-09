-- Módulo `bar`: seção de bebidas da página do evento, irmã de `cardapio`.
--
-- `cardapio` deixa de ser votação e vira exibição de pratos; `bar` é a seção
-- nova para o serviço de bar, o drink de assinatura e a carta de bebidas.
--
-- `alter type ... add value` não roda no mesmo bloco transacional que outra
-- DDL/DML em algumas versões do Postgres — esta migration faz só isso; as
-- tabelas de conteúdo e o drop da votação ficam nos arquivos seguintes, com o
-- valor novo já commitado.

alter type public.module_id add value if not exists 'bar';
