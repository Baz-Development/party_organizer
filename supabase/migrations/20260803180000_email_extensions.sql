-- Extensões para a fila de e-mail: `pg_cron` agenda a chamada periódica de
-- processamento, `pg_net` faz a chamada HTTP para a rota interna que
-- processa a fila. Mesmo padrão de `pgcrypto` na fundação — extensão
-- declarada onde é usada, não numa migration central.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
