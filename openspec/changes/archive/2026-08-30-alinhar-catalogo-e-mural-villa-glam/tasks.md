## 1. Migrations — tipos de evento

- [x] 1.1 Criar `supabase/migrations/<ts>_event_kind_villa_glam.sql`:
      `alter type event_kind add value` para `aniversario`, `confraternizacao`,
      `outros`.
- [x] 1.2 Criar `supabase/migrations/<ts>_migrate_infantil.sql`:
      `update events set kind = 'aniversario' where kind = 'infantil'`.
- [x] 1.3 `npm run db:reset`, `npm run db:types`, `npm run db:diff`.

## 2. Migrations — mural sem aprovação prévia

- [x] 2.1 Criar `supabase/migrations/<ts>_mural_sem_previa.sql`: recriar
      `submit_mural_message` para inserir sempre `status = 'aprovada'`, com novo
      parâmetro `p_photo_path text default null`; `update mural_messages set
      status = 'aprovada' where status = 'pendente'`; `add column photo_path text`.
- [x] 2.2 `npm run db:reset`, `npm run db:types`.

## 3. Validação e tipos

- [x] 3.1 `src/lib/types.ts`: `EventKind` = os sete tipos da ata.
- [x] 3.2 `src/lib/validation/`: schema de tipo de evento e schema do recado do
      mural (mensagem + `photoPath?`).

## 4. Mural com foto

- [x] 4.1 `src/app/[id]/[slug]/galeria/`: adicionar upload de foto ao formulário
      do mural (reaproveitar o componente de upload da galeria).
- [x] 4.2 `src/lib/db/media.ts`: `submitMuralMessage` passa `photoPath`; validar
      prefixo `{event_id}/`.
- [x] 4.3 `POST /api/eventos/[slug]/mural`: aceitar `photoPath`; resposta nunca
      mais devolve item pendente.

## 5. Painel

- [x] 5.1 `/admin` criação de página: `<select>` de tipo com os sete valores.
- [x] 5.2 `src/app/painel/moderacao/ModerationQueue.tsx`: remover a aba/seção de
      recados pendentes; manter a de fotos.

## 6. Testes e docs

- [x] 6.1 `tests/rls.test.mjs` ou teste de função: recado num evento com política
      `previa` nasce `aprovada`.
- [x] 6.2 `npm run verify`.
- [x] 6.3 README: atualizar a lista de tipos de evento e a nota sobre moderação
      (mural sem aprovação prévia, galeria com).
