## Why

Na ata ALF Eventos o fluxo comercial é: a Equipe ALF Eventos fecha o contrato,
**cadastra o cliente** e **monta a página do evento**; o cliente então recebe o
acesso e passa a cuidar do conteúdo e da moderação da sua página. O painel
administrativo da ata (seção 7) lista "Criar eventos", "Editar eventos" e
"Cadastrar convidados" como ações do admin.

Hoje o produto é self-service: qualquer e-mail que peça link mágico vira um
`cliente` com perfil criado no primeiro acesso, e o próprio cliente cria o
evento em `/onboarding`. Não existe o conceito de "conta provisionada pelo
admin" nem de "admin cria a página e atribui a um anfitrião".

Depende de `simplificar-papeis-cliente-admin` (dois papéis).

## What Changes

- **BREAKING**: a criação de evento deixa de ser self-service. Só o `admin` cria
  uma página de evento, e no ato define o anfitrião (uma conta de cliente).
- **BREAKING**: `/onboarding` deixa de criar evento. Um cliente sem nenhuma
  página vê um estado "sua página está sendo preparada".
- O admin passa a **provisionar contas de cliente** informando nome e e-mail; o
  primeiro login daquela pessoa reaproveita o perfil provisionado.
- Uma pessoa que autentica sem ter sido provisionada e sem ser anfitriã de
  nenhum evento não alcança nenhum painel (mensagem "conta sem acesso").
- O cliente mantém tudo que já tem sobre a própria página: editar conteúdo,
  cronograma, capa, módulos, prazo de RSVP e **moderar** galeria e mural.
- Novo painel de admin: lista de contas de cliente (criar, ver eventos
  vinculados) e criação de página de evento com escolha do anfitrião.

## Capabilities

### New Capabilities

- `administracao`: provisionamento de contas de cliente pelo admin e criação de
  páginas de evento com atribuição de anfitrião.

### Modified Capabilities

- `autenticacao`: perfil provisionado pelo admin; acesso negado a quem não foi
  provisionado nem é anfitrião.
- `eventos`: criação de evento restrita ao admin, com anfitrião informado no ato.

## Impact

- **Depende de**: `simplificar-papeis-cliente-admin`, `add-supabase-foundation`,
  `add-guests-rsvp-backend` (moderação já existente).
- **Migrations novas**: tabela `client_invites` (ou reuso de `profiles` com
  coluna `invited_by` + `pending`); função `admin_provision_client(email, name)`
  `security definer`; política de `events_insert` restrita a `is_platform_admin`;
  ajuste de `handle_new_user` para casar com perfil provisionado por e-mail.
- **Código afetado**: `src/app/onboarding/**` (vira tela informativa),
  `src/app/admin/AdminPanel.tsx`, `src/app/api/eventos/route.ts` (POST só admin),
  `src/lib/db/events.ts`, `src/lib/db/profiles.ts`, `src/lib/auth/guards.ts`
  (`requireSession` recusa conta sem acesso), `src/lib/validation/**`.
- **Rotas afetadas**: `POST /api/eventos` (só admin), novas
  `POST /api/admin/clientes`, `GET /api/admin/clientes`.
- **Telas afetadas**: `/admin` (gestão de clientes + criar página),
  `/onboarding` (informativa), `/painel` (estado "página em preparação").
- **Riscos**: e-mail provisionado com caixa diferente da usada no login;
  colisão entre `handle_new_user` e perfil pré-criado; cliente perder acesso por
  engano se o admin não o vincular a nenhum evento.
