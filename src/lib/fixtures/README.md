# Fixtures — dados que ainda são falsos

Cada arquivo aqui alimenta uma tela cujo módulo ainda não tem tabela no banco.
São mocks, e estão nesta pasta justamente para que isso fique explícito no
código: se uma tela importa de `@/lib/fixtures/`, ela **não** mostra dados
reais.

O cabeçalho de cada arquivo nomeia o change que o remove.

| Arquivo | Removido por |
| --- | --- |
| `media.ts` | `add-media-backend` |
| `menu.ts` | removido — cardápio e bar viraram conteúdo do evento (`menu_items`, `bar_items`, `bar_*`) |
| `secret-santa.ts` | removido — configuração virou coluna do evento (`secret_santa_*`) |
| `painel.ts` | removido — a receita do mês (não é MRR, plataforma não tem assinatura) e o ticket médio agora vêm de `payments` via `getPlatformRevenue` (`src/lib/db/platform.ts`) |

O que **não** está aqui já vem do banco: eventos, perfis, módulos habilitados,
cronograma, cardápio, bar, feed de atividade e amigo secreto.

`src/lib/mock-data.ts` continua existindo por um motivo diferente: é a fonte a
partir da qual `npm run db:seed` gera `supabase/seed.sql`. Nenhuma página ou
rota deve importá-lo.
