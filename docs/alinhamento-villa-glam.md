# Alinhamento à ata Villa Glam — plano de execução

Este documento acompanha os três changes de OpenSpec criados para levar o
produto ao modelo descrito em
`docs/ATA DE REUNIÃO — PROJETO APP VILLA GLAM.pdf`.

## O que muda no modelo de usuários

| Antes                                                         | Depois                                                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `cliente`, `organizacao`, `admin` + convidado sem conta | **`admin`** (Equipe Villa Glam), **`cliente`** (anfitrião) + **convidado** sem conta |
| Cliente cria a própria página em`/onboarding`             | **Admin** cadastra o cliente e cria a página, atribuindo o anfitrião                                |
| Painel`/organizacao`, tabelas `organizations`             | Removidos                                                                                                   |
| Mural herda a moderação do evento                           | Mural publica na hora; anfitrião só oculta/remove                                                         |
| Tipos: casamento, debutante, infantil, corporativo, formatura | casamento, debutante, corporativo, aniversário, formatura, confraternização, outros                      |

Papéis do produto depois do alinhamento:

- **Admin** — cadastra contas de cliente, cria as páginas de evento, aprova
  fotos da galeria (visão global da plataforma).
- **Cliente (anfitrião)** — acessa só a própria página: edita conteúdo,
  cronograma, capa, módulos e prazo de RSVP; modera galeria e mural do seu
  evento. Não cria páginas.
- **Convidado** — sem conta, entra pelo link público do evento publicado; sobe
  fotos no mural, participa do RSVP, enquete de cardápio, amigo secreto e
  curtidas.

## Ordem de aplicação

Os changes têm dependência entre si — aplicar nesta ordem:

```
1. simplificar-papeis-cliente-admin      (remove o papel/tabelas de organização)
2. admin-provisiona-clientes-e-paginas   (admin cadastra cliente e cria página)
3. alinhar-catalogo-e-mural-villa-glam   (tipos de evento + mural sem moderação)
```

O change 3 depende só do change 1; pode ser feito em paralelo ao 2 se quiser,
mas o `/admin` de criação de página tocado pelos dois vai dar conflito — mais
simples é seguir 1 → 2 → 3.

## Como rodar cada change

Pré-requisitos (iguais aos do README): **Node 20+**, **Docker Desktop** e
**make**. Suba o ambiente uma vez:

```bash
make dev          # instala, sobe o Supabase local, aplica migrations, abre :3000
```

Para cada change, na ordem acima:

```bash
# 1. Ler os artefatos
npx openspec show <nome-do-change>
npx openspec validate <nome-do-change> --strict

# 2. Implementar as tarefas (marca [x] em tasks.md conforme avança)
#    ou use o fluxo assistido:
/opsx:apply <nome-do-change>

# 3. Cada change tem migrations novas — depois de criá-las:
npm run db:reset      # recria o banco: migrations em ordem + seed
npm run db:types      # regenera src/lib/database.types.ts
npm run db:diff       # falha se o schema divergir das migrations

# 4. Verificação completa (o que o CI roda)
npm run verify        # lint + tipos + build + testes de RLS/sessão

# 5. Arquivar quando as tarefas estiverem 100%
npx openspec archive <nome-do-change>   # promove os deltas para openspec/specs/
```

## Testando o novo fluxo manualmente

Depois do change 2 aplicado, com `make dev` rodando:

1. Entre em `/entrar` com `admin@exemplo.local` e abra o link mágico na caixa de
   e-mail local (`http://127.0.0.1:54424`).
2. No `/admin`, aba **Clientes**, cadastre um cliente (nome + e-mail).
3. Ainda no `/admin`, aba **Páginas**, crie um evento e escolha esse cliente
   como anfitrião.
4. Entre em `/entrar` com o e-mail do cliente, abra o link mágico: o `/painel`
   mostra a página criada.
5. Como cliente, publique o evento em `/painel/editor` e modere galeria/mural em
   `/painel/moderacao`.
6. Numa aba anônima, abra `/e/<slug>` e, como convidado, suba uma foto no mural
   e responda ao RSVP.

## Impacto em ambientes staging/produção

- O change 1 recria o enum `user_role`. Rodar a migration em staging antes de
  produção e conferir `npm run db:diff -- --linked`.
- Perfis com papel `organizacao` viram `cliente` automaticamente (a migration
  inclui o `update`). Confirmar no Studio que nenhum acesso ficou órfão.
- O change 2 usa `auth.admin.inviteUserByEmail`: em staging/produção o SMTP
  precisa estar configurado (Authentication → SMTP no painel do Supabase).
