# bar Specification

## Purpose

Exibir as informações do bar do evento na página pública: o tipo de serviço
(open bar, bar pago, carta de vinhos...), um drink de assinatura em destaque e a
carta de bebidas. Conteúdo editorial escrito pelo anfitrião no editor; o
convidado só lê.

## Requirements

### Requirement: Conteúdo do bar do evento

O sistema MUST permitir que quem administra o evento configure, todos
opcionais: um texto de serviço de bar, o nome e a descrição de um drink de
assinatura, e uma lista de bebidas (nome obrigatório, descrição opcional). A
ordem das bebidas é definida pelo anfitrião e MUST ser preservada entre
consultas.

#### Scenario: Serviço e drink de assinatura definidos

- **WHEN** o anfitrião preenche "Open bar a noite toda" e um drink de assinatura
  "Flor de Itu" com descrição
- **THEN** a seção Bar da página mostra o texto de serviço e um destaque com o
  drink de assinatura, quando o módulo `bar` está habilitado

#### Scenario: Só a carta de bebidas

- **WHEN** o anfitrião cadastra bebidas mas não preenche serviço nem drink de
  assinatura
- **THEN** a seção Bar mostra apenas a lista de bebidas

#### Scenario: Bebida sem nome

- **WHEN** uma bebida é salva sem nome
- **THEN** a bebida é descartada na gravação

#### Scenario: Curadoria restrita

- **WHEN** um convidado tenta configurar o bar ou cadastrar bebidas
- **THEN** a operação é recusada por falta de autorização

### Requirement: Visibilidade herdada do evento

O conteúdo do bar MUST seguir a visibilidade do evento: legível por qualquer
pessoa quando o evento está publicado, e por quem administra o evento em
qualquer estado.

#### Scenario: Substituição em bloco

- **WHEN** o anfitrião salva o editor com uma nova lista de bebidas
- **THEN** a lista anterior é substituída inteira pela nova, na nova ordem
