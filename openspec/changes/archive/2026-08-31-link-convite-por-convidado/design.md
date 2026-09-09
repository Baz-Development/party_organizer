## Context

O link identificado por convidado já existe: `public.guest_invites (guest_id, token)`,
token de 32 bytes hex, consultado só pelas funções `security definer`
`get_guest_by_invite_token` / `submit_rsvp`. A página `/{id}/{slug}/rsvp` lê
`?convite=<token>` (`searchParams.convite`) e faz prefill via `GET /api/rsvp/[token]`.

O que falta:

1. **O anfitrião não enxerga o token.** `listGuests` faz `select("*")` só de
   `guests`; a RLS `guest_invites_manage` permite `for all`, mas nada no app lê
   `guest_invites` no caminho do painel. Não há UI de "copiar link".
2. **Distribuição presa ao e-mail.** `createGuest` insere o convite mas não
   enfileira nada; o link só sai pelo botão "Enviar convites", que depende de
   `guests.email` e de `mockEmailProvider`. Em `APP_ENV=local`,
   `resolveRecipient` devolve `EMAIL_TEST_REDIRECT_ADDRESS ?? null` e, sem a var,
   a mensagem é descartada (`descartado_fora_de_producao`). Nada chega ao Mailpit.
3. **RSVP anônimo pela URL nua.** Sem token, `RsvpFlow` mostra o passo 1 de nome
   livre. Se `guest_list_open` está ligado, `submit_open_rsvp` cria um convidado
   `unlisted` novo — nunca casa com o convidado já cadastrado. Se desligado, a
   resposta é recusada. É esse caminho que o usuário reportou como "qualquer um
   confirma" e "não persiste com o mesmo nome".

Restrições:
- Requisito de privacidade (`rsvp`): a lista de convidados e o token **não**
  podem vazar para o público. O picker de nomes público está fora.
- `openspec/config.yaml`: migrations, RLS e seed são tarefas separadas; PT-BR nos
  artefatos; sem host/chave hardcoded.
- Next.js 16 — conferir `node_modules/next/dist/docs/` antes de mexer em
  `route.ts` / `searchParams` / `after()`.

## Goals / Non-Goals

**Goals:**
- Anfitrião copia e compartilha (WhatsApp/qualquer meio) o link de cada convidado
  a partir de `/painel/convidados`, sem depender de e-mail.
- Link pronto no instante em que o convidado é adicionado.
- Toda confirmação sempre amarra a um registro da lista (via token de convidado
  ou via link de auto-cadastro explícito) — fim do convidado anônimo pela URL nua.
- Auto-cadastro continua possível, mas só quando o anfitrião liga o link e só por
  aquele link.
- E-mail de convite visível no Mailpit em dev.

**Non-Goals:**
- Picker público de nomes / autocompletar contra a lista (viola privacidade).
- Merge automático de convidados `unlisted` já existentes com a lista.
- Troca do `mockEmailProvider` por provedor real de produção.
- Encurtador de URL / domínio próprio de link.
- Rastreamento de abertura/clique do link.

## Decisions

### D1. Expor o token ao anfitrião por join na leitura da lista, não por nova coluna

`GET /api/eventos/[slug]/convidados` passa a devolver `inviteUrl` por convidado.
Implementação: `listGuests` faz `select("*, guest_invites(token)")` (embedded
resource do PostgREST; a FK `guest_invites.guest_id → guests.id` já existe). A
RLS `guest_invites_manage` (`for all ... using can_manage_event(...)`) já cobre a
leitura pelo anfitrião — **nenhuma migration de policy nova é necessária**;
confirmar em teste RLS. `src/lib/db/mappers.ts` monta
`inviteUrl = ${NEXT_PUBLIC_SITE_URL}${eventUrl(event, "/rsvp")}?convite=${token}`.

Alternativa descartada: RPC dedicada `get_guest_invite_links(event_id)` —
overhead sem ganho, já que a RLS resolve.

Alternativa descartada: coluna `token` desnormalizada em `guests` — duplicação e
risco de divergência.

### D2. `events.self_signup_token` nullable + único, gerado/revogado pelo anfitrião

```sql
alter table public.events
  add column self_signup_token text unique;

-- Migração de dados: eventos hoje com lista aberta ganham um token;
-- os demais ficam null (auto-cadastro desligado).
update public.events
set self_signup_token = encode(extensions.gen_random_bytes(32), 'hex')
where guest_list_open = true;

alter table public.events drop column guest_list_open;
```

`src/lib/types.ts`: trocar `guestListOpen: boolean` por
`selfSignupToken: string | null` (o painel nunca manda o token — manda intenção
ligar/desligar; o valor é derivado). `src/lib/validation/event.ts`: remover
`guestListOpen`, sem novo campo editável direto — a rota de editor ganha uma ação
`ativar`/`revogar`.

Nova RPC `security definer` para o caminho do convidado:

```sql
create function public.submit_self_signup_rsvp(
  p_event_slug text, p_signup_token text, p_name text,
  p_status public.rsvp_status, p_companions integer, p_kids integer, p_dietary text
) returns public.guests
language plpgsql security definer set search_path = '' as $$
declare v_event public.events; v_guest public.guests;
begin
  select * into v_event from public.events e
    where e.slug = p_event_slug
      and e.status = 'publicado'
      and e.self_signup_token is not null
      and e.self_signup_token = p_signup_token;
  if not found then
    raise exception 'lista_fechada' using errcode = 'P0001';
  end if;
  if v_event.rsvp_deadline is not null and now() > v_event.rsvp_deadline then
    raise exception 'prazo_encerrado' using errcode = 'P0001';
  end if;
  if p_status = 'recusado' then p_companions := 0; p_kids := 0; end if;
  insert into public.guests (event_id, name, status, companions, kids, dietary, unlisted, responded_at)
  values (v_event.id, p_name, p_status, p_companions, p_kids, p_dietary, true, now())
  returning * into v_guest;
  insert into public.guest_invites (guest_id) values (v_guest.id);
  insert into public.rsvp_responses (guest_id, event_id, status, companions, kids, dietary)
  values (v_guest.id, v_event.id, p_status, p_companions, p_kids, p_dietary);
  return v_guest;
end; $$;

grant execute on function public.submit_self_signup_rsvp(text, text, text, public.rsvp_status, integer, integer, text) to anon, authenticated;

-- submit_open_rsvp antiga é derrubada
drop function if exists public.submit_open_rsvp(text, text, public.rsvp_status, integer, integer, text);
```

Uma função de comparação em tempo constante não é necessária: o token tem 256
bits de entropia e a busca é por igualdade indexada; o vetor de timing não é
explorável nesse espaço.

Alternativa descartada: manter `guest_list_open` e só adicionar o token — deixa
dois interruptores com semântica sobreposta.

### D3. Rota e página de RSVP

- `src/app/[id]/[slug]/rsvp/page.tsx`: ler `searchParams` `{ convite?, lista? }`,
  passar ambos ao `RsvpFlow`.
- `RsvpFlow.tsx`:
  - `convite` presente → fluxo identificado (inalterado).
  - `lista` presente, `convite` ausente → passo 1 de nome livre, POST em
    `/api/eventos/[slug]/rsvp-aberto` com `{ signupToken, name, ... }`.
  - nenhum dos dois → tela "Convite necessário / peça seu link a quem organiza"
    (reaproveita o bloco `guestListClosed` atual, sem depender de
    `event.guestListOpen`).
  - `event.guestListOpen` sai do `EventSummary`.
- `/api/eventos/[slug]/rsvp-aberto`: `submitOpenRsvpSchema` ganha
  `signupToken: z.string().min(1)`; chama `submit_self_signup_rsvp`. Token
  inválido → `RsvpError` "lista_fechada" → 400.

### D4. Painel: link + WhatsApp

`GuestManager.tsx`:
- Sheet de detalhe: campo somente-leitura com `guest.inviteUrl`, botão "Copiar
  link" (`navigator.clipboard.writeText`), botão "Enviar pelo WhatsApp".
- WhatsApp: `https://wa.me/${digits(phone)}?text=${encodeURIComponent(msg)}` quando
  há telefone; senão `https://wa.me/?text=${encodeURIComponent(msg)}`.
  `msg = "Oi, {nome}! Você foi convidado para {evento}. Confirme sua presença: {inviteUrl}"`.
- `navigator.share({ url })` como opção no mobile (fallback para copiar).
- `AddGuestSheet`: após criar, não fecha direto — mostra o `inviteUrl` do
  convidado recém-criado com os mesmos botões.
- Botão "Enviar convites pendentes" vira "Enviar convites por e-mail" e ganha uma
  linha de ajuda ("opcional — o link também pode ser copiado por convidado").
- Coluna/ação de bulk "Copiar todos os links" (junta `inviteUrl` de `filtered`).
- Bloco de configuração do link de auto-cadastro do evento (ativar/revogar +
  copiar) — pode ficar no topo da tela de convidados ou em `/painel/editor`;
  decisão: em `/painel/convidados` num card "Link de auto-cadastro", perto de
  "Importar lista".

### D5. Mailpit em desenvolvimento

O `mockEmailProvider` não faz rede. Para o e-mail aparecer no Mailpit sem trocar
o provedor de produção:
- `supabase/config.toml`: sob `[local_smtp]` (Mailpit já roda, porta web 54424)
  descomentar `smtp_port = 54425`.
- Novo provedor `src/lib/email/smtpEmailProvider.ts` (usa `nodemailer`, já não;
  então `net`/SMTP mínimo ou adicionar `nodemailer` como devDependency) que envia
  para `EMAIL_SMTP_HOST:EMAIL_SMTP_PORT` sem auth/TLS.
- `src/lib/email/index.ts`: `emailProvider = emailEnv.EMAIL_SMTP_HOST ? smtpEmailProvider : mockEmailProvider`.
- `.env` local: `EMAIL_TEST_REDIRECT_ADDRESS=teste@convite.local`,
  `EMAIL_SMTP_HOST=127.0.0.1`, `EMAIL_SMTP_PORT=54425`.
- `resolveRecipient` continua redirecionando para o endereço de teste fora de
  produção — o Mailpit recebe tudo nesse endereço, que é o comportamento
  desejado e já coberto pela spec `notificacoes-email`.

Se adicionar `nodemailer` for indesejado, alternativa: manter o e-mail mockado e
tratar a visibilidade no Mailpit como não-objetivo — o link no painel já resolve
a dor principal. Decisão: **adicionar `nodemailer` como devDependency**, atrás da
env, sem tocar produção.

## Risks / Trade-offs

- [Remoção de `guest_list_open` quebra `EventSummary` / mock-data / testes] →
  varredura pelos 24 arquivos que citam `guestListOpen`; `src/lib/mock-data.ts`,
  `src/lib/fixtures/painel.ts`, `tests/rsvp.test.mjs` atualizados na mesma change.
- [Convidados `unlisted` criados antes desta change continuam órfãos] → fora de
  escopo; a lista já os marca "(não listado)" e o anfitrião pode remover.
- [Link vaza se o anfitrião encaminha para a pessoa errada] → é a natureza de um
  link de convite; token é por-convidado e revogável removendo/recriando o
  convidado. Sem mitigação adicional nesta change.
- [`navigator.clipboard` / `navigator.share` exigem HTTPS ou localhost] → dev é
  localhost; produção é HTTPS. Fallback: `<input>` selecionável.
- [`nodemailer` só deve rodar em dev] → import dinâmico dentro do provider,
  guardado pela env; não entra no bundle de produção (`server-only`).
- [Migração de dados no `update ... where guest_list_open` roda em produção] →
  idempotente e só afeta eventos com a flag ligada; rollback = recriar a coluna e
  derivar `guest_list_open = self_signup_token is not null`.

## Migration Plan

1. Migration A: `add column self_signup_token`, backfill dos eventos com
   `guest_list_open = true`, `drop column guest_list_open`.
2. Migration B: `submit_self_signup_rsvp`, `drop function submit_open_rsvp`,
   grants.
3. Regenerar `src/lib/database.types.ts` (`supabase gen types`).
4. Código de app (libs, rotas, componentes) + `.env.example` + `config.toml`.
5. `scripts/db/generate-seed.mjs` / `supabase/seed.sql` se referenciam a flag.
6. Rollback: reverter migrations (recria `guest_list_open` derivada), `git revert`
   do código. Nenhum dado de convidado é destruído.

## Open Questions

- O card de "Link de auto-cadastro" fica em `/painel/convidados` ou
  `/painel/editor`? (Proposta: convidados.)
- Mensagem padrão do WhatsApp deve ser editável pelo anfitrião nesta change ou
  fica fixa? (Proposta: fixa agora.)
- Adicionar `nodemailer` é aceitável, ou preferir um cliente SMTP mínimo caseiro?
  (Proposta: `nodemailer` devDependency.)
