# Fixtures — dados que ainda são falsos

Cada arquivo aqui alimenta uma tela cujo módulo ainda não tem tabela no banco.
São mocks, e estão nesta pasta justamente para que isso fique explícito no
código: se uma tela importa de `@/lib/fixtures/`, ela **não** mostra dados
reais.

O cabeçalho de cada arquivo nomeia o change que o remove.

| Arquivo | Removido por |
| --- | --- |
| `media.ts` | `add-media-backend` |
| `menu.ts` | `add-menu-backend` |
| `secret-santa.ts` | `add-secret-santa-backend` |
| `painel.ts` | ainda sem change — métricas e feed de atividade |

O que **não** está aqui já vem do banco: eventos, organizações, perfis,
módulos habilitados e cronograma.

`src/lib/mock-data.ts` continua existindo por um motivo diferente: é a fonte a
partir da qual `npm run db:seed` gera `supabase/seed.sql`. Nenhuma página ou
rota deve importá-lo.
