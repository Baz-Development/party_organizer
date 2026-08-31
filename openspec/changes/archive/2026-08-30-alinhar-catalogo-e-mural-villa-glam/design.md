## Decisões

### `event_kind`: adicionar valores, migrar `infantil`

`alter type ... add value` não roda dentro de bloco transacional junto com
outras DDL em algumas versões; manter a migration só para isso.

```sql
-- <ts>_event_kind_villa_glam.sql
alter type public.event_kind add value if not exists 'aniversario';
alter type public.event_kind add value if not exists 'confraternizacao';
alter type public.event_kind add value if not exists 'outros';
```

Numa migration seguinte (novo arquivo, para o novo valor já estar commitado):

```sql
update public.events set kind = 'aniversario' where kind = 'infantil';
```

`infantil` permanece no enum (Postgres não remove valor), mas sai de uso: a
validação Zod em `src/lib/validation` e o `<select>` de tipo em `/admin` passam a
ofertar só os sete da ata. `src/lib/types.ts` reflete o mesmo conjunto.

### Mural sempre aprovado

`submit_mural_message` (em `20260803150400_media_functions.sql`) hoje faz:

```sql
case when v_event.moderation_policy = 'imediata' then 'aprovada' else 'pendente' end
```

Passa a inserir sempre `'aprovada'`. A migration também promove o passivo:

```sql
update public.mural_messages set status = 'aprovada' where status = 'pendente';
```

A RLS de `mural_messages` não muda: select público continua por
`status = 'aprovada'`, e `can_manage_event` continua podendo `update`/`delete`
para ocultar/remover. `/painel/moderacao` deixa de consultar recados pendentes.

### Foto no recado

Coluna `photo_path text` (nullable) em `mural_messages`, mesmo padrão de
`events.cover_path` / fotos da galeria: prefixo `{event_id}/`, bucket
`event-media`, validado em `src/lib/db/media.ts`. `submit_mural_message` ganha
parâmetro `p_photo_path` opcional; a validação de formato/tamanho acontece no
upload para o Storage (client → signed URL), como já é na galeria.

## Variáveis de ambiente

Nenhuma nova.
