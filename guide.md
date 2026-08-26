# Guia do site — Convite (organizador de festas)

Guia de referência de como o site funciona: como subir o ambiente, como logar
em cada perfil e o que cada painel faz.

## 1. Subindo o ambiente

Pré-requisitos: Node 20+, Docker Desktop rodando, `make`.

```bash
make dev
```

Isso instala dependências, sobe o Supabase local (Postgres + Auth + Studio +
caixa de e-mail), gera o `.env.local`, aplica migrations pendentes e roda a
aplicação.

| Serviço | URL |
| --- | --- |
| Aplicação | http://localhost:3000 |
| Studio (Supabase) | http://127.0.0.1:54423 |
| Caixa de e-mail (Mailpit) | http://127.0.0.1:54424 |
| Índice de todas as telas | http://localhost:3000/rotas |

> As portas usam a faixa `544xx` em vez da `543xx` padrão do Supabase CLI
> porque outro projeto Supabase já ocupa essa faixa nesta máquina. Os valores
> reais vivem em `supabase/config.toml`.

Outros comandos úteis: `make reset` (recria banco com seed, apaga dados
locais), `make studio` / `make mail` (abrem essas URLs no navegador), `make
stop` (derruba containers preservando dados), `make help` (lista tudo).

## 2. Login — como entrar em cada perfil

O login é **sem senha**, por link mágico. Não existe cadastro de senha nem
formulário de "criar conta" separado — é sempre o mesmo fluxo em `/entrar`,
mudando apenas o e-mail digitado.

**Passo a passo:**

1. Abra http://localhost:3000/entrar
2. Digite um dos e-mails do seed (tabela abaixo)
3. Envie o formulário — a resposta na tela é sempre a mesma frase genérica,
   exista ou não conta com aquele e-mail (evita que alguém descubra quais
   e-mails têm conta)
4. Abra a caixa de e-mail local: http://127.0.0.1:54424 (Mailpit) — em
   desenvolvimento nenhum e-mail sai da máquina, tudo é capturado ali
5. Clique no link mágico do e-mail mais recente
6. Isso troca o link por uma sessão (`/api/auth/callback`) e te redireciona
   para a página que você pediu originalmente (ou para `/` por padrão)
7. Navegue até o painel — o link não "sabe" seu papel, quem decide se você
   pode entrar em cada painel é o layout daquela seção (item 3)

### E-mails de exemplo (seed)

| E-mail | Papel (`role`) | Painel | Contexto |
| --- | --- | --- | --- |
| `admin@exemplo.local` | `admin` | `/admin` | Administração da plataforma inteira |
| `contato@santaclara.com.br` | `organizacao` | `/organizacao` | Dono(a) da organização "Fazenda Santa Clara" |
| `marina-e-thiago@exemplo.local` | `cliente` | `/painel` | Anfitriã(o) do evento `marina-e-thiago` (casamento), hospedado na Fazenda Santa Clara |

Outros e-mails `cliente` também existem no seed, cada um anfitrião de um dos
eventos de exemplo: `15-anos-sofia@exemplo.local`,
`aniversario-do-bento@exemplo.local`, `convencao-nexus-2026@exemplo.local`.

Os e-mails e dados vêm de `src/lib/mock-data.ts` → gerados para
`supabase/seed.sql` via `npm run db:seed` / `make seed`.

## 3. Papéis e controle de acesso

Três papéis no enum `user_role` (`supabase/migrations/20260803120100_profiles.sql`),
guardado em `profiles.role`:

- **`admin`** — acesso à plataforma inteira
- **`organizacao`** — dono/membro de uma organização (ex.: um espaço de
  eventos que hospeda festas de vários clientes)
- **`cliente`** — anfitrião de um evento específico

A checagem de papel acontece **no servidor**, no layout de cada seção
protegida — não no `src/proxy.ts` (renomeação do antigo `middleware.ts`), que
só renova o cookie de sessão:

| Rota | Guarda (`src/lib/auth/guards.ts`) | Layout |
| --- | --- | --- |
| `/admin` | `requireAdmin` — só `admin` | `src/app/admin/layout.tsx` |
| `/organizacao` | `requireOrganizationMember` — precisa ser membro da organização, ou `admin` | `src/app/organizacao/layout.tsx` |
| `/painel`, `/painel/*`, `/onboarding` | `requireSession` — qualquer usuário logado | `src/app/painel/layout.tsx` |

Além disso, toda tabela tem RLS (Row Level Security) no Postgres como última
linha de defesa — mesmo que uma rota de API esqueça de checar o papel, o
banco recusa a leitura/escrita fora do escopo do usuário.

## 4. O que tem em cada painel

### Painel Admin (`/admin`)
Métricas da plataforma, lista de organizações, clientes recentes.

### Painel da Organização (`/organizacao`)
Catálogo/espaço da organização, endereços, calendário de eventos daquela
organização.

### Painel do Cliente (anfitrião de um evento)
| Rota | Tela |
| --- | --- |
| `/onboarding` | Assistente de criação de evento |
| `/painel` | Visão geral: contagem regressiva, confirmações de RSVP, link público do evento, atividade recente |
| `/painel/convidados` | Gestão de convidados |
| `/painel/editor` | Editor da página do evento: tema, tipografia, textos, preview ao vivo |
| `/painel/moderacao` | Fila de moderação da galeria/mural |

### Área pública do convidado (`/e/[slug]/...`)
| Rota | Tela |
| --- | --- |
| `/e/[slug]` | Página do evento |
| `/e/[slug]/rsvp` | Confirmação de presença (3 passos) |
| `/e/[slug]/presentes` | Lista de presentes → checkout → sucesso |
| `/e/[slug]/galeria` | Galeria e mural de fotos |
| `/e/[slug]/cardapio` | Votação de cardápio |
| `/e/[slug]/amigo-secreto` | Amigo secreto — cadastro |
| `/e/[slug]/amigo-secreto/revelacao` | Amigo secreto — revelação |

Slugs de exemplo do seed: `marina-e-thiago`, `15-anos-sofia`,
`aniversario-do-bento`, `convencao-nexus-2026`.

## 5. Modelo de domínio (visão geral)

```
profiles (role: admin | organizacao | cliente)
  └─ organizations ← organization_members
       └─ events (+ event_content, rsvp_settings, media_settings)
            ├─ guests / guest_invites / rsvp_responses
            ├─ menu_polls / menu_options / menu_votes
            ├─ photos / mural (+ reações, buckets de storage)
            ├─ gifts / gift_reservations / payments / payment_events
            └─ amigo secreto: secret_santa_participants, wishlists,
               exclusions, draws, assignments, reveals

email_messages / email_suppressions — fila de e-mails transacionais,
processada por cron via /api/interno/fila-email/processar
```

`supabase/migrations/` é a única fonte de verdade do schema — nada de alterar
schema direto pelo painel do Supabase em staging/produção, isso é sobrescrito
na próxima promoção.

## 6. Estrutura do código

```
src/
  proxy.ts            Renova a sessão (era o middleware.ts)
  app/
    page.tsx           Landing
    entrar/             Login por link mágico
    rotas/              Índice navegável de todas as telas
    onboarding/         Criação de evento
    painel/             Layout + telas do cliente
    organizacao/  admin/  Layouts que guardam papel
    e/[slug]/           Páginas públicas do evento
    api/                 Route handlers
  lib/
    auth/               Guardas de rota (requireAdmin, requireSession, ...)
    db/                  Acesso a dados (único lugar com snake_case)
    supabase/            Clients: server, client, admin (service-role)
    fixtures/            O que ainda não migrou pro banco (ver fixtures/README.md)
    mock-data.ts         Fonte do seed — não importar em páginas

supabase/
  migrations/           Schema (fonte de verdade)
  seed.sql              Gerado a partir de mock-data.ts
```

Alguns módulos (presentes, galeria, mural, cardápio, amigo secreto) ainda leem
fixtures em `src/lib/fixtures/` em vez do banco — cada um migra em seu
próprio change.

## 7. Referências

- `README.md` — visão geral do projeto, comandos, ambientes (local → staging
  → produção)
- `AGENTS.md` — aviso de que esta versão do Next.js tem mudanças de ruptura;
  consulte `node_modules/next/dist/docs/` antes de escrever código
- `/rotas` no app rodando — índice ao vivo de todas as telas
