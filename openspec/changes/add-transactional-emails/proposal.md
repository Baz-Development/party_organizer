## Why

Os módulos anteriores geram links que só têm valor se chegarem à pessoa certa: o
convite com token de RSVP, o link de revelação do amigo secreto, o recibo de um
presente pago. Hoje não existe nenhum caminho de saída — o anfitrião teria que
copiar e colar link por link. Este change fecha o ciclo.

## What Changes

- Introduz um provedor de e-mail transacional, com remetente e domínio configurados
  por ambiente.
- Cria a fila de envio: toda mensagem é enfileirada, enviada em segundo plano, com
  novas tentativas em caso de falha temporária e registro do resultado.
- Cria os modelos de mensagem: convite com link de RSVP, lembrete de RSVP,
  confirmação de resposta, recibo de presente, link de revelação do amigo secreto e
  link de acesso ao painel.
- Adiciona disparo em lote de convites a partir de `/painel/convidados`, com
  acompanhamento de entregues, falhados e não enviados.
- Adiciona descadastro e supressão: e-mail que rejeita ou retorna permanentemente
  deixa de receber novas mensagens.
- Em local e staging, nenhuma mensagem sai para endereço real.

## Capabilities

### New Capabilities

- `notificacoes-email`: provedor por ambiente, fila com novas tentativas, modelos de
  mensagem, disparo em lote, supressão e registro de entrega.

### Modified Capabilities

Nenhuma.

## Impact

- **Depende de**: `add-supabase-foundation` (magic link já usa envio de e-mail),
  `add-guests-rsvp-backend` (convites e confirmações),
  `add-gifts-payments-backend` (recibos) e `add-secret-santa-backend` (revelação).
- **Novas dependências**: SDK do provedor de e-mail.
- **Novas variáveis de ambiente**: chave do provedor, remetente, domínio e um
  interruptor que redireciona ou descarta envios fora de produção.
- **Novas tabelas**: `email_messages`, `email_suppressions`.
- **Rotas afetadas**: novas rotas de disparo em lote, de recebimento de eventos de
  entrega do provedor e de descadastro.
- **Telas afetadas**: `/painel/convidados` (enviar convites, ver estado de entrega),
  `/painel` (lembretes).
- **Riscos**: enviar e-mail de teste para convidados reais; link com token vazando
  em log de provedor; domínio sem autenticação caindo em spam.
