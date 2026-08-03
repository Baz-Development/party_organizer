## 1. Migrations — schema, storage, RLS

- [x] 1.1 `20260803140000_media_enums.sql`: enums `photo_status`, `mural_status`, `reaction_target`, `moderation_policy`.
- [x] 1.2 `20260803140100_events_media_settings.sql`: colunas `events.cover_path` e `events.moderation_policy` (default `'previa'`).
- [x] 1.3 `20260803140200_storage_buckets.sql`: buckets `event-media` e `guest-uploads` (privados, `file_size_limit`, `allowed_mime_types`).
- [x] 1.4 `20260803140300_photos_mural_reactions.sql`: tabelas `photos`, `mural_messages`, `reactions` com índices; sem `updated_at`/trigger — os únicos updates são de moderação (`status`) e curtida (`likes_count`), sem necessidade de rastrear a última alteração.
- [x] 1.5 `20260803140400_media_functions.sql`: funções `security definer` `submit_photo`, `assert_can_submit_photo`, `submit_mural_message`, `react_to_item` (helpers `_require_published_module`, `_resolve_media_author`). Moderação (aprovar/ocultar) e exclusão viram `update`/`delete` diretos governados por RLS — não precisam de função dedicada, mesmo padrão de `guests`.
- [x] 1.6 `20260803140500_rls_media.sql`: RLS + grants (incluindo `service_role` explícito) de `photos`, `mural_messages`, `reactions`, e políticas de `storage.objects` para os dois buckets.
- [x] 1.7 Rodar `npx --no-install supabase db reset` e confirmar que todas as migrations aplicam sem erro.
- [x] 1.8 Rodar `npm run db:types` e revisar o diff de `src/lib/database.types.ts`.

## 2. Camada de dados e validação

- [x] 2.1 `src/lib/validation/media.ts`: schemas Zod de envio de foto, envio de recado, moderação, capa e política de moderação.
- [x] 2.2 `src/lib/db/media.ts`: `listPhotos` (paginado, público x administrador), `requestPhotoUpload`, `confirmPhotoUpload`, `moderatePhoto`, `deletePhoto`.
- [x] 2.3 `src/lib/db/media.ts`: `listMuralMessages` (paginado), `submitMuralMessage`, `moderateMuralMessage`, `deleteMuralMessage`.
- [x] 2.4 `src/lib/db/media.ts`: `reactToItem` (curtida idempotente por `visitor_id`).
- [x] 2.5 `src/lib/db/events.ts`: `setEventCover` e `moderationPolicy` na extensão de `updateEvent`, validando que o path da capa pertence ao evento.
- [x] 2.6 Atualizar `src/lib/db/mappers.ts`/`toEventSummary` para expor `moderationPolicy`/`coverPath` e remover o comentário de fixture da galeria.
- [x] 2.7 Atualizar `src/lib/types.ts` (`EventSummary`, `Photo`, `MuralMessage`) para os campos novos (status de moderação, `url`, `coverUrl` etc.).

## 3. Rotas de API

- [x] 3.1 `POST /api/eventos/[slug]/galeria/upload`: emite URL assinada de upload (valida evento publicado, módulo habilitado, autor, limite de envios).
- [x] 3.2 `POST /api/eventos/[slug]/galeria`: confirma upload concluído e cria o registro da foto.
- [x] 3.3 `GET /api/eventos/[slug]/galeria`: lista fotos visíveis, paginada; inclui pendentes/ocultas quando quem pede administra o evento.
- [x] 3.4 `POST /api/eventos/[slug]/galeria/[id]/curtir`: registra curtida.
- [x] 3.5 `PATCH /api/eventos/[slug]/galeria/[id]`: aprova/oculta (quem administra).
- [x] 3.6 `DELETE /api/eventos/[slug]/galeria/[id]`: remove foto e arquivo do Storage.
- [x] 3.7 `GET /api/eventos/[slug]/mural` e `POST /api/eventos/[slug]/mural`: listar e enviar recado.
- [x] 3.8 `POST /api/eventos/[slug]/mural/[id]/curtir`, `PATCH /api/eventos/[slug]/mural/[id]`, `DELETE /api/eventos/[slug]/mural/[id]`.
- [x] 3.9 `PATCH /api/eventos/[slug]/capa` (+ `POST /api/eventos/[slug]/capa/upload`): define a capa do evento (quem administra).
- [x] 3.10 Mapear `DbError`/erros de domínio para status HTTP em todas as rotas novas, seguindo o padrão de `src/app/api/rsvp/[token]/route.ts`.

## 4. UI

- [x] 4.1 Reescrever `src/app/e/[slug]/galeria/GalleryAndMural.tsx` para consumir as rotas reais (listagem paginada, envio de foto com upload assinado, envio de recado, curtidas) em vez de `src/lib/fixtures/media.ts`.
- [x] 4.2 Gerar/persistir `visitorId` no cliente (`localStorage`, `src/lib/visitor.ts`) para curtidas e envios.
- [x] 4.3 `/painel/editor`: campo de capa (upload + preview) e seletor de política de moderação, salvos via `actions.ts`.
- [x] 4.4 `/painel/moderacao`: fila de aprovação de fotos e recados pendentes, com ações de aprovar/ocultar/remover (link adicionado à navegação do painel).
- [x] 4.5 Remover `src/lib/fixtures/media.ts` e qualquer import remanescente dele.

## 5. Testes

- [x] 5.1 `tests/media.test.mjs`: cenários de RLS de `photos`/`mural_messages`/`reactions` (quem administra vê pendente, público só vê aprovado, convidado de um evento não vazando para outro).
- [x] 5.2 Cenários de moderação: aprovação prévia vs. imediata, aprovar, ocultar, remover.
- [x] 5.3 Cenários de limite de envio por intervalo e de curtida idempotente por `visitor_id`.
- [x] 5.4 Cenário de capa/política: só quem administra altera política de moderação e capa.
- [x] 5.5 Rodar `npm test` e confirmar que a suíte completa passa, incluindo os testes existentes (58 passando, 2 skipped, 0 falhas).

## 6. Fechamento

- [x] 6.1 Rodar `npm run lint`, `npm run typecheck`, `npm run build` e corrigir o que falhar.
- [x] 6.2 Marcar todas as tarefas deste arquivo como concluídas.
- [x] 6.3 Rodar `npx openspec validate add-media-storage-backend --strict` e corrigir até passar.
- [x] 6.4 Rodar `npx openspec archive add-media-storage-backend -y`.
- [x] 6.5 Commit com mensagem clara, `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
