## Why

`/e/[slug]/galeria` mostra placeholders e um estado vazio; o mural tem recados
fixos. É o módulo que faz o convidado voltar à página depois da festa — e o único em
que conteúdo enviado por terceiros aparece publicamente, o que exige moderação e
limites de upload desde o começo.

## What Changes

- Introduz o Supabase Storage com buckets separados para imagens do evento (capa,
  galeria curada pelo anfitrião) e para envios de convidados.
- Substitui o componente de placeholder por imagens reais, com URLs assinadas e
  variantes de tamanho.
- Persiste fotos enviadas por convidados, com autor, legenda, data e curtidas.
- Persiste recados do mural, com autor, mensagem, data e curtidas.
- Adiciona moderação: o anfitrião escolhe entre publicação imediata ou aprovação
  prévia, e pode aprovar, ocultar ou remover qualquer item.
- Adiciona limites de upload por tipo, tamanho e quantidade, e remoção dos arquivos
  do Storage quando o item é excluído.

## Capabilities

### New Capabilities

- `midia-storage`: buckets, políticas de acesso a arquivos, upload assinado, limites
  de tipo e tamanho, e ciclo de vida do arquivo junto ao registro no banco.
- `galeria`: fotos do evento e envios de convidados, curtidas e listagem paginada.
- `mural`: recados de convidados, curtidas e listagem.

### Modified Capabilities

- `eventos`: passa a expor a política de moderação e a imagem de capa como
  configuração do evento.

## Impact

- **Depende de**: `add-supabase-foundation` (buckets criados por migration, RLS,
  `is_event_public`) e da identificação por token de `add-guests-rsvp-backend` para
  atribuir autoria quando o convidado é conhecido.
- **Novos buckets**: `event-media` (curado pelo anfitrião) e `guest-uploads`.
- **Novas tabelas**: `photos`, `mural_messages`, `reactions`.
- **Rotas afetadas**: novas rotas de galeria, mural, upload assinado, curtida e
  moderação.
- **Telas afetadas**: `/e/[slug]/galeria`, `/e/[slug]` (capa), `/painel/editor`
  (capa e moderação), `/painel` (fila de aprovação).
- **Riscos**: conteúdo enviado por desconhecidos aparecendo na página de um cliente;
  custo de storage sem limites; URLs de arquivo vazando conteúdo de evento privado.
