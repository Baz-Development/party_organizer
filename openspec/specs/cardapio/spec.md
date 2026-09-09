# cardapio Specification

## Purpose

Exibir o cardápio do evento — os pratos servidos, agrupados por etapa da
refeição — na página pública, como conteúdo editorial que o anfitrião escreve no
editor. Não há votação: o convidado só lê.

## Requirements

### Requirement: Itens de cardápio do evento

O sistema MUST permitir que quem administra o evento cadastre itens de cardápio,
cada um com etapa da refeição (`course`), nome do prato e, opcionalmente, uma
descrição. A ordem dos itens é definida pelo anfitrião e MUST ser preservada
entre consultas.

#### Scenario: Item cadastrado

- **WHEN** o anfitrião adiciona um prato "Petit gâteau" na etapa "Sobremesa"
- **THEN** o prato passa a existir no cardápio do evento
- **AND** aparece na seção Cardápio da página quando o módulo `cardapio` está
  habilitado

#### Scenario: Agrupamento por etapa

- **WHEN** o cardápio tem pratos em "Entrada" e "Prato principal"
- **THEN** a página os apresenta agrupados por etapa, na ordem em que a primeira
  ocorrência de cada etapa aparece na lista

#### Scenario: Nome obrigatório

- **WHEN** um item é salvo sem etapa ou sem nome
- **THEN** o item é descartado na gravação (não quebra o salvamento do resto)

#### Scenario: Curadoria restrita

- **WHEN** um convidado tenta cadastrar ou editar itens de cardápio
- **THEN** a operação é recusada por falta de autorização

### Requirement: Visibilidade herdada do evento

Os itens de cardápio MUST seguir a visibilidade do evento: legíveis por qualquer
pessoa quando o evento está publicado, e por quem administra o evento em
qualquer estado.

#### Scenario: Evento em rascunho

- **WHEN** alguém sem vínculo com o evento acessa a página de um evento em
  rascunho
- **THEN** não recebe os itens de cardápio (a página inteira responde 404)

#### Scenario: Substituição em bloco

- **WHEN** o anfitrião salva o editor com uma nova lista de pratos
- **THEN** a lista anterior é substituída inteira pela nova, na nova ordem
