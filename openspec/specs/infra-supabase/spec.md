# Infraestrutura Supabase

## Purpose

Define a base sobre a qual o produto roda: configuração exclusivamente por
variáveis de ambiente (nenhuma URL ou chave em código), ambiente local
reprodutível por um comando, migrations versionadas como única fonte de verdade
do schema, tipos TypeScript gerados a partir do banco e seed de desenvolvimento
equivalente aos mocks originais.

## Requirements

### Requirement: Configuração exclusivamente por ambiente

O sistema MUST NOT conter em código-fonte nenhuma URL de projeto, chave de API,
project-ref ou string de conexão do Supabase. Toda essa configuração MUST vir de
variáveis de ambiente, lidas por um único módulo de configuração que valida a
presença e o formato de cada variável antes de a aplicação atender requisições.

#### Scenario: Variável obrigatória ausente

- **WHEN** a aplicação inicia sem uma variável obrigatória do Supabase definida
- **THEN** a inicialização falha imediatamente com uma mensagem que nomeia a
  variável faltante
- **AND** nenhuma requisição é atendida com configuração parcial

#### Scenario: Mesmo build em ambientes diferentes

- **WHEN** o mesmo artefato de build é executado apontando para variáveis de
  ambiente de local, staging ou produção
- **THEN** a aplicação conecta ao projeto Supabase correspondente sem qualquer
  alteração de código

#### Scenario: Chave privilegiada nunca exposta ao navegador

- **WHEN** o bundle enviado ao navegador é inspecionado
- **THEN** a chave `service-role` não aparece em nenhum arquivo servido ao cliente
- **AND** apenas a URL do projeto e a chave pública anônima estão presentes

#### Scenario: Arquivo de exemplo publicado

- **WHEN** uma pessoa clona o repositório
- **THEN** encontra um arquivo de exemplo versionado listando todas as variáveis
  necessárias, com valores de placeholder e sem nenhum segredo real
- **AND** os arquivos `.env` reais permanecem fora do controle de versão

### Requirement: Ambiente local reprodutível

O sistema MUST oferecer um ambiente Supabase local completo (banco, autenticação e
storage) iniciado por um comando único, sem depender de projeto na nuvem para
desenvolver.

#### Scenario: Subida do ambiente do zero

- **WHEN** uma pessoa executa o comando de subida do ambiente local em uma máquina
  limpa com os pré-requisitos instalados
- **THEN** o banco é criado, todas as migrations são aplicadas em ordem e o seed é
  carregado
- **AND** a aplicação apontada para o `.env` local funciona sem passos manuais
  adicionais

#### Scenario: Reset do banco local

- **WHEN** uma pessoa executa o comando de reset do banco local
- **THEN** o banco volta ao estado definido pelas migrations mais o seed
- **AND** nenhum dado criado manualmente durante o desenvolvimento sobrevive

### Requirement: Migrations versionadas como única fonte de verdade do schema

Toda alteração de schema, política de RLS, função ou trigger MUST existir como
arquivo de migration versionado no repositório. Alterações feitas direto pelo
painel do Supabase em staging ou produção MUST NOT ser consideradas válidas.

#### Scenario: Promoção entre ambientes

- **WHEN** as migrations são aplicadas a um projeto de staging ou produção vazio
- **THEN** o schema resultante é idêntico ao do ambiente local
- **AND** a ordem de aplicação é determinística

#### Scenario: Divergência detectada

- **WHEN** o schema de um ambiente remoto difere do estado esperado pelas migrations
- **THEN** o comando de verificação de diferenças reporta a divergência
- **AND** o processo de deploy é interrompido

### Requirement: Tipos do banco gerados e verificados

O sistema MUST gerar os tipos TypeScript a partir do schema do banco e usá-los na
camada de acesso a dados, de modo que uma coluna renomeada ou removida quebre a
verificação de tipos.

#### Scenario: Schema alterado sem regenerar tipos

- **WHEN** uma migration renomeia uma coluna usada pela aplicação e os tipos não são
  regenerados
- **THEN** a verificação de tipos do projeto falha apontando o uso desatualizado

### Requirement: Seed de desenvolvimento equivalente aos mocks atuais

O ambiente local MUST ser semeado com os mesmos eventos de exemplo hoje presentes
nos mocks, para que as telas existentes continuem navegáveis após a migração.

#### Scenario: Slugs de exemplo disponíveis

- **WHEN** o seed é carregado no ambiente local
- **THEN** os eventos de slug `marina-e-thiago`, `15-anos-sofia`,
  `aniversario-do-bento` e `convencao-nexus-2026` existem e estão publicados
- **AND** cada um tem organização, cronograma e módulos habilitados coerentes com o
  que as telas exibiam com dados mockados

#### Scenario: Seed não roda em produção

- **WHEN** o comando de seed é executado apontando para o ambiente de produção
- **THEN** a operação é recusada
