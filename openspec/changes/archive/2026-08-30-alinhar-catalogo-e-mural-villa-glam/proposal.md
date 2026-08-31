## Why

Dois pontos da ata Villa Glam ainda divergem do produto:

1. **Tipos de evento** (seção 2): a ata lista casamento, debutante, corporativo,
   aniversário, formatura, confraternização e "outros". O enum `event_kind` hoje
   tem `casamento, debutante, infantil, corporativo, formatura` — falta
   aniversário, confraternização e "outros"; "infantil" não está na ata.
2. **Mural** (seção 4): a ata decidiu *"Moderação — Não existiria"* para o mural,
   e o convidado *"pode agir subindo fotos no mural ou participando da festa"*.
   Hoje o mural herda a política de moderação do evento (pode nascer pendente) e
   só aceita texto. A galeria mantém moderação (a ata marca "Moderação —" em
   aberto para a galeria, e "Aprovar fotos" é ação do admin na seção 7).

## What Changes

- `event_kind` ganha `aniversario`, `confraternizacao` e `outros`. `infantil`
  vira apelido migrado para `aniversario` (sem valor novo em uso; ver design).
- O **mural publica sempre imediatamente**, independentemente da
  `moderation_policy` do evento. O anfitrião mantém ocultar e remover recados
  (moderação reativa), mas não há fila de aprovação prévia para o mural.
- O recado do mural passa a aceitar **uma foto opcional** além do texto, com o
  mesmo Storage e limites da galeria.
- A galeria segue como está: aprovação prévia quando o evento assim define.

## Capabilities

### Modified Capabilities

- `eventos`: catálogo de tipos de evento alinhado à ata.
- `mural`: sem aprovação prévia; recado com foto opcional.
- `galeria`: nenhuma mudança de comportamento — apenas registro de que a
  moderação da galeria é independente da do mural.

## Impact

- **Depende de**: `add-media-storage-backend`, `simplificar-papeis-cliente-admin`.
- **Migrations novas**: `alter type event_kind add value` para os três novos;
  migração de eventos `infantil` → `aniversario`; alteração de
  `submit_mural_message` (nasce sempre `aprovada`); coluna `photo_path` opcional
  em `mural_messages`.
- **Código afetado**: `src/lib/types.ts` (`EventKind`), `src/lib/validation/**`,
  `src/app/[id]/[slug]/galeria/**` (form do mural com upload),
  `src/lib/db/media.ts`, telas de seleção de tipo em `/admin` (criação de página).
- **Rotas afetadas**: `POST /api/eventos/[slug]/mural` (aceita foto),
  `POST /api/eventos/[slug]/mural` deixa de retornar item pendente.
- **Telas afetadas**: `/e/[slug]/galeria` (mural com foto), `/painel/moderacao`
  (some a fila de recados pendentes; fica só a de fotos).
- **Riscos**: recados hoje pendentes num evento com política `previa` precisam
  ser promovidos a `aprovada` na migration; abuso no mural sem aprovação prévia
  — mitigado pelo limite de envios por convidado já existente.
