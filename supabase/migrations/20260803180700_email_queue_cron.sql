-- Agenda a chamada periódica que processa a fila de e-mail.
--
-- O segredo e a URL base NÃO entram nesta migration — nenhum host, chave ou
-- project-ref no código-fonte é regra do projeto inteiro (`openspec/ROADMAP.md`),
-- e isso vale tanto para código quanto para migration versionada. Em vez de
-- hardcoded, o job lê duas GUCs de banco (`app.settings.email_base_url`,
-- `app.settings.email_queue_cron_secret`) via `current_setting(..., true)` —
-- `true` no segundo argumento faz devolver `null` em vez de erro quando a
-- GUC não foi configurada, para a migration rodar em qualquer ambiente antes
-- da configuração operacional.
--
-- Configuração por ambiente (fora de git, uma vez por projeto Supabase):
--   alter database postgres set app.settings.email_base_url = 'https://SEU_DOMINIO';
--   alter database postgres set app.settings.email_queue_cron_secret = 'MESMO_VALOR_DE_EMAIL_QUEUE_CRON_SECRET';
-- Sem essas duas GUCs configuradas, o job roda a cada minuto e falha
-- silenciosamente (a rota interna devolve 401 por header ausente) — a fila
-- só é processada pela tentativa best-effort via `after()` até a configuração
-- ser feita. Local: `supabase/seed.sql`/rotina de setup pode configurar as
-- GUCs do container de desenvolvimento; não é feito aqui para não fixar uma
-- URL de ambiente numa migration.

select
  cron.schedule(
    'process-email-queue',
    '* * * * *',
    $$
    select net.http_post(
      url := current_setting('app.settings.email_base_url', true) || '/api/interno/fila-email/processar',
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-email-queue-secret', current_setting('app.settings.email_queue_cron_secret', true)
      ),
      body := '{}'::jsonb
    )
    where current_setting('app.settings.email_base_url', true) is not null
      and current_setting('app.settings.email_queue_cron_secret', true) is not null;
    $$
  )
where not exists (select 1 from cron.job where jobname = 'process-email-queue');
