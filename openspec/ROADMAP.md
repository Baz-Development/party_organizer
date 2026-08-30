# Roadmap do backend

Sete changes levam o produto de "14 telas com mocks" a backend completo em Supabase.
A ordem importa: cada módulo herda RLS, identidade e camada de dados da fundação.

```
add-supabase-foundation  ← base obrigatória
        │
        ├── add-guests-rsvp-backend        (convidados, tokens de convite, RSVP)
        │        │
        │        ├── add-secret-santa-backend   (usa o token para identificar)
        │        └── add-menu-poll-backend      (usa o token para 1 voto/pessoa)
        │
        ├── add-gifts-payments-backend     (presentes, cotas, checkout, webhook)
        ├── add-media-storage-backend      (Storage, galeria, mural, moderação)
        │
        └── add-transactional-emails       ← por último: consome os links de
                                             convite, recibo e revelação
```

## Ordem recomendada

| # | Change | Por que nesta posição |
| --- | --- | --- |
| 1 | `add-supabase-foundation` | Ninguém compila sem banco, auth, RLS e `.env` |
| 2 | `add-guests-rsvp-backend` | Entrega o valor central e cria o token que 3 módulos reutilizam |
| 3 | `add-media-storage-backend` | Independente dos demais; libera imagens reais nas telas |
| 4 | `add-gifts-payments-backend` | Dinheiro real — merece ser feito sem pressa e com testes |
| 5 | `add-menu-poll-backend` | Menor módulo; depende só do token |
| 6 | `add-secret-santa-backend` | Sigilo exige revisão cuidadosa das políticas |
| 7 | `add-transactional-emails` | Só faz sentido quando existem links para enviar |

3, 4 e 5 são paralelizáveis entre si depois do 2.

## Estado dos artefatos

Os sete changes estão implementados e arquivados em
`openspec/changes/archive/`; as specs promovidas vivem em `openspec/specs/`.

| Change | proposal | specs | design | tasks | Estado |
| --- | --- | --- | --- | --- | --- |
| `add-supabase-foundation` | ✅ | ✅ | ✅ | ✅ | Arquivado |
| `add-guests-rsvp-backend` | ✅ | ✅ | ✅ | ✅ | Arquivado |
| `add-media-storage-backend` | ✅ | ✅ | ✅ | ✅ | Arquivado |
| `add-gifts-payments-backend` | ✅ | ✅ | ✅ | ✅ | Arquivado |
| `add-menu-poll-backend` | ✅ | ✅ | ✅ | ✅ | Arquivado |
| `add-secret-santa-backend` | ✅ | ✅ | ✅ | ✅ (46/47) | Arquivado — tela `/painel/amigo-secreto` adiada, sem mock prévio |
| `add-transactional-emails` | ✅ | ✅ | ✅ | ✅ (33/34) | Arquivado — cobertura de teste ponta a ponta de código server-only registrada como lacuna, não implementada |

`design` e `tasks` de cada módulo foram gerados só quando ele entrou na fila,
como planejado — decisões de schema tomadas na hora, não seis changes antes.

## Ajustes pós-fundação

| Change | Efeito |
| --- | --- |
| `simplificar-papeis-cliente-admin` | Remove o módulo `organizacoes` (papel `organizacao`, tabelas `organizations`/`organization_members`, `/organizacao`, `events.organization_id`). O MVP Villa Glam tem só dois papéis autenticados: `cliente` e `admin`. |

## Fluxo por change

```bash
openspec status --change <nome>   # o que falta
openspec show <nome>              # ler os artefatos
openspec validate <nome>          # checar formato
```

Para gerar `design` e `tasks` de um módulo: `/opsx:propose <nome>`.
Para implementar: `/opsx:apply <nome>`. Ao terminar: `openspec archive <nome>`,
que promove as specs do change para `openspec/specs/`.

## Ambientes

| Ambiente | Projeto Supabase | Origem das variáveis |
| --- | --- | --- |
| local | Supabase CLI em Docker | `.env.local`, copiado de `.env.example` |
| staging | projeto na nuvem próprio | variáveis do provedor de deploy |
| produção | projeto na nuvem próprio | variáveis do provedor de deploy |

Regra que atravessa os sete changes: nenhuma URL, chave ou project-ref no
código-fonte, e nenhuma alteração de schema feita pelo painel do Supabase — só
migrations versionadas.
