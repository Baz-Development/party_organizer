## REMOVED Requirements

### Requirement: Cadastro de organização parceira

**Reason**: Organizações parceiras não fazem parte do MVP Villa Glam. A ata
define só dois públicos autenticados (Equipe Villa Glam e Anfitrião). O cadastro
comercial de parceiros sai do produto até que exista demanda real.

### Requirement: Membros da organização

**Reason**: Sem organizações, não há composição de membros. Cada evento tem um
único anfitrião; o admin enxerga todos.

### Requirement: Isolamento entre organizações

**Reason**: O isolamento passa a ser por evento/anfitrião, coberto pela
capability `eventos` e pela RLS de `events`. Não há mais fronteira de
organização a proteger.

### Requirement: Métricas da organização

**Reason**: O painel `/organizacao` é removido. As métricas de portfólio, se
voltarem, serão do painel de admin sobre todos os eventos.
