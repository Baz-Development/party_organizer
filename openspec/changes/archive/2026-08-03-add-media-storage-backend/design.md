## Context

`/e/[slug]/galeria` hoje renderiza `PHOTOS`/`MURAL` de `src/lib/fixtures/media.ts`
e `EventSummary.gallery` vem sempre vazio das rotas reais (`mappers.ts` diz
explicitamente que a galeria "pertence ao módulo de mídia, que ainda não tem
tabela"). Este change cria essa tabela — e o Storage por trás dela.

Este é o primeiro change do roadmap a usar Supabase Storage. Não há bucket nem
política de `storage.objects` no repositório ainda; os padrões daqui (bucket
privado, path prefixado por `event_id`, upload por URL assinada emitida pelo
servidor) tornam-se o modelo para `add-gifts-payments-backend` (comprovantes)
se algum dia precisar de upload.

Reaproveita da fundação: `can_manage_event`, `is_event_public`,
`touch_updated_at`, o padrão de RLS "público lê o que está publicado, dono
administra" de `event_modules`/`schedule_items`, e o padrão de função
`security definer` para o caminho do convidado sem conta
(`20260803130400_guest_functions.sql`). Reaproveita de `add-guests-rsvp-backend`
a tabela `guests` para atribuir autoria quando o convidado veio por link de
convite (token), mas galeria e mural também aceitam autor "solto" (nome
digitado), porque `guest_list_open` já permite RSVP de quem não foi
cadastrado — mídia não pode ser mais restritiva que RSVP.

## Goals / Non-Goals

**Goals:**
- Galeria (fotos enviadas por convidados) e mural (recados) com moderação —
  aprovação prévia ou publicação imediata, configurável por evento.
- Curtidas em fotos e recados, uma por visitante, sem exigir conta.
- Upload direto do navegador para o Storage via URL assinada de uso único,
  nunca com credencial de longa duração no cliente.
- Limite de tipo/tamanho de arquivo e de frequência de envio por convidado.
- Capa do evento como configuração do evento, restrita a quem administra.
- Arquivo e registro morrem juntos: excluir a foto remove o objeto do Storage.

**Non-Goals:**
- Variantes de tamanho (thumbnail/original) geradas no servidor — a Pro-only
  `storage.image_transformation` não está disponível localmente; a UI usa o
  objeto original e pode aplicar `?width=`/`?height=` via URL de transformação
  quando o projeto estiver num plano que suporte, sem mudar o schema.
- Sniffing profundo de bytes para confirmar que o conteúdo é mesmo uma imagem
  do tipo declarado — o bucket recusa por `allowed_mime_types` (o que o
  cliente declara no upload) e a extensão é validada contra esse mesmo tipo;
  detectar um JPEG disfarçado de PNG exigiria inspecionar magic bytes, fora de
  escopo aqui (ver Riscos).
- Rotina de limpeza de upload abandonado como cron gerenciado — implementada
  como script (`scripts/db/cleanup-orphans.mjs`) rodável sob demanda/cron
  externo, não como Edge Function agendada.
- Curadoria de galeria pelo anfitrião (upload direto pelo anfitrião) — a
  spec só cobre moderação de envios de convidado; o bucket `event-media` por
  ora guarda só a capa.

## Decisions

### Dois buckets privados, path prefixado por `event_id`

`event-media` (capa, curado por quem administra) e `guest-uploads` (envios de
convidado). Nenhum dos dois é `public`: toda leitura passa por URL assinada
emitida depois de checar visibilidade do evento e estado de moderação do
item — é o único jeito de atender "arquivo de evento em rascunho não é
legível" e "item pendente só é visível a quem administra" ao mesmo tempo,
já que `storage.objects` não sabe o que é `status = 'aprovada'` numa tabela
de aplicação sem uma política que faça join, o que tornaria cada leitura de
imagem uma consulta adicional. Path: `{event_id}/{uuid}.{ext}` — não
adivinhável (uuid), e o prefixo por evento é o que a política de
`event-media` usa para restringir cada anfitrião ao próprio evento.

Limite de tipo e tamanho são configurados no próprio bucket
(`file_size_limit`, `allowed_mime_types`), não checados só na aplicação: o
Storage recusa o upload antes de gravar um byte, então mesmo um cliente que
pule a validação do formulário esbarra no limite.

### Upload por URL assinada emitida com a chave `service-role`

`storage.createSignedUploadUrl` é chamado pelo servidor com
`createSupabaseAdminClient()`, depois que a rota valida (no client
autenticado do chamador, via RLS/RPC): evento publicado, módulo habilitado,
autor identificado (nome digitado ou token de convite) e limite de envios no
intervalo não excedido. Alternativa descartada: dar a `anon`/`authenticated`
uma política de `insert` em `storage.objects` para `guest-uploads` e deixar o
cliente chamar `createSignedUploadUrl` direto. Isso reduziria uma
responsabilidade do backend, mas moveria a checagem de "módulo habilitado" e
"limite de envios" para uma política SQL que teria que reimplementar o que já
existe em `is_event_public`/`can_manage_event` mais uma contagem de linhas
recentes — RLS não é o lugar certo para rate limiting. Manter a emissão no
servidor centraliza as duas checagens num só ponto testável.

O registro em `photos`/`mural_messages` só é criado depois que o cliente
confirma o upload concluído (`POST` de confirmação com o path recebido) — não
há trigger no Storage que crie a linha sozinho. Upload iniciado e nunca
confirmado não cria registro (fica órfão só no bucket); a limpeza é o script
de Non-Goals.

### Moderação como um único enum de status, não um boolean

`photo_status`/`mural_status`: `'pendente' | 'aprovada' | 'oculta'` (mesmo
vocabulário para os dois, dois enums porque são domínios distintos — não uma
tabela polimórfica). Substitui o boolean `approved` do fixture porque
"aprovar" e "ocultar depois de já ter aparecido" são estados diferentes: uma
foto aprovada e depois ocultada não deve voltar a `pendente` (não está mais
esperando aprovação, está escondida deliberadamente). A política de
moderação do evento (`events.moderation_policy`, `'previa' | 'imediata'`)
decide o status inicial no `insert`: `'previa'` nasce `'pendente'`,
`'imediata'` nasce `'aprovada'`.

### Curtidas por `visitor_id`, não por conta

Convidado não tem login; "contar cada visitante uma única vez" precisa de
alguma identidade estável sem exigir conta. Decisão: um UUID v4 gerado no
navegador na primeira visita à página do evento, guardado em `localStorage`
(`convite:visitor-id`) e enviado como corpo da requisição de curtida — não
cookie, porque a leitura da galeria já não depende de sessão e um
`localStorage` por origem evita colisão entre visitantes que usam o mesmo
Wi-Fi/IP. Tabela única `reactions (target_type, target_id, visitor_id)` com
unique composto faz a curtida repetida ser um no-op idempotente
(`on conflict do nothing`) em vez de um erro que o cliente precisa tratar.
Isto não é identidade forte — um visitante que limpa o `localStorage` pode
curtir de novo — aceito porque o requisito é anti-fricção de UI, não
anti-fraude.

### Envio de galeria/mural via função `security definer`

Mesmo padrão de `submit_rsvp`/`submit_open_rsvp`: `submit_photo`,
`submit_mural_message`, `react_to_item` rodam como `security definer` porque
o convidado sem conta (`anon`) precisa gravar sem ter uma política de RLS de
`insert` genérica — a função valida módulo habilitado, evento publicado,
limite de envios e author obrigatório dentro de uma transação, e devolve o
status resultante. Sem isso, a checagem de limite de envios (contar linhas
recentes) teria que estar numa política RLS com subquery correndo a cada
`insert`, mais frágil de testar que uma função.

### Capa e política de moderação como colunas de `events`

`events.cover_path text` (path no bucket `event-media`, nullable) e
`events.moderation_policy public.moderation_policy not null default
'previa'`. Ficam em `events` (não numa tabela `event_media_settings` à parte)
porque são 1:1 com o evento e já cabem no mesmo `update` que o editor faz —
criar uma tabela separada exigiria uma segunda escrita e um segundo
`select` só para dois campos. `setEventCover` (camada de dados) confere que o
path começa com `{event_id}/` antes de gravar — é a defesa contra "capa de
outro evento", já que a RLS de `events` não enxerga o conteúdo de um `text`.

## Risks / Trade-offs

- [Extensão declarada não bate com o conteúdo real do arquivo] → o bucket
  recusa por `allowed_mime_types` do `Content-Type` declarado no upload; um
  cliente malicioso que declare `image/png` para um arquivo qualquer passa.
  Mitigação aceita para este change: a Data API do Supabase local não expõe
  sniffing de bytes; miolo do risco fica para uma Edge Function futura, fora
  de escopo. Registrado como Non-Goal.
- [URL assinada de upload emitida e nunca usada] → nenhum registro é criado
  (o `insert` em `photos`/`mural_messages` só acontece na confirmação), então
  a galeria nunca mostra nada órfão; o arquivo pode ficar solto no bucket até
  a rotina de limpeza (Non-Goal) rodar.
- [Custo de Storage sem limite de quantidade total por evento] → mitigado
  parcialmente pelo limite de envios por intervalo (`RATE_LIMIT_*` em
  `src/lib/db/media.ts`); um limite de quantidade total por evento fica fora
  de escopo deste change (não está na spec) e é um Open Question para um
  change futuro de billing.
- [`localStorage` como identidade de curtida] → visitante que limpa dados ou
  troca de navegador recupera o direito de curtir de novo. Aceito: o
  requisito da spec é "não duplicar por visitante", não "impedir fraude".

## Migration Plan

Migrations, uma responsabilidade por arquivo, seguindo o timestamp mais
recente da fundação (`20260803130500`):

1. `20260803140000_media_enums.sql` — `photo_status`, `mural_status`,
   `reaction_target`, `moderation_policy`.
2. `20260803140100_events_media_settings.sql` — `events.cover_path`,
   `events.moderation_policy`.
3. `20260803140200_storage_buckets.sql` — `insert into storage.buckets`
   para `event-media` e `guest-uploads` (privados, `file_size_limit`,
   `allowed_mime_types`).
4. `20260803140300_photos_mural_reactions.sql` — tabelas `photos`,
   `mural_messages`, `reactions`.
5. `20260803140400_media_functions.sql` — `submit_photo`,
   `confirm_photo_upload`, `submit_mural_message`, `react_to_item`,
   `moderate_item`.
6. `20260803140500_rls_media.sql` — RLS de `photos`, `mural_messages`,
   `reactions`, `storage.objects` (políticas dos dois buckets), grants
   (incluindo `service_role`, que não herda grants retroativos — bug já
   encontrado em `add-guests-rsvp-backend`).
7. `20260803140600_events_cover_rls.sql` — nada de RLS nova (a de `events`
   já cobre `update`), só documentação se necessário; na prática pode ser
   dispensada se a coluna nova não exigir política própria.

Nenhuma variável de ambiente nova: os dois buckets usam a mesma
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/
`SUPABASE_SERVICE_ROLE_KEY` já configuradas pela fundação. Depois de cada
migration, `supabase db reset` local e `npm run db:types`.

Rollback: `supabase db reset` reaplica do zero a partir de
`supabase/migrations/`; não há dado de produção em jogo ainda (change não
implantado). Reverter em produção exigiria uma migration `down` explícita,
fora de escopo do fluxo atual do projeto (que não versiona `down`).

## Open Questions

- Limite de quantidade total de arquivos por evento (cota de storage por
  plano) — não está na spec; decidir quando o billing por organização for
  desenhado.
- Se/quando `storage.image_transformation` estiver disponível no ambiente,
  avaliar servir variantes redimensionadas em vez do objeto original.
