## MODIFIED Requirements

### Requirement: Ciclo de vida do evento

Um evento MUST estar em exatamente um destes estados: rascunho, publicado ou
encerrado. Somente eventos publicados MUST ser visíveis ao público.

#### Scenario: Publicação

- **WHEN** o anfitrião ou um admin publica um evento em rascunho
- **THEN** o estado passa a publicado
- **AND** a página pública do evento passa a responder para qualquer visitante

#### Scenario: Despublicação

- **WHEN** o anfitrião ou um admin retorna um evento publicado para rascunho
- **THEN** a página pública deixa de responder para visitantes sem vínculo
- **AND** os dados já coletados permanecem preservados

#### Scenario: Encerramento

- **WHEN** o anfitrião ou um admin encerra um evento
- **THEN** o evento deixa de aceitar novas interações de convidado
- **AND** continua acessível em leitura ao anfitrião e ao admin

#### Scenario: Somente anfitrião ou admin publica

- **WHEN** um usuário sem vínculo com o evento e sem papel de admin tenta alterar
  seu estado
- **THEN** a operação é recusada por falta de autorização

## REMOVED Requirements

### Requirement: Vínculo opcional com organização

**Reason**: O MVP Villa Glam não tem organizações parceiras. Cada evento pertence
a um único anfitrião (`cliente`), e o `admin` enxerga todos. A coluna
`events.organization_id` e o painel `/organizacao` são removidos no mesmo change.

**Migration**: eventos com `organization_id` preenchido mantêm o `host_profile_id`
como único administrador; o campo é descartado.
