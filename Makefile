# Atalhos de desenvolvimento.
#
#   make dev     sobe tudo que é preciso e abre a aplicação
#   make help    lista os alvos
#
# `make dev` é seguro de repetir: não apaga dados. Para voltar o banco ao
# estado das migrations + seed, use `make reset`.

# Sem trocar o SHELL: o make do Windows ignora um SHELL que não resolva por
# caminho do Windows e cai no `sh` do Git Bash de qualquer jeito. Os recipes
# abaixo são POSIX e não dependem de bash.

# Cada alvo depende do estado deixado pelo anterior (contêiner de pé, .env
# preenchido); rodar em paralelo embaralharia isso.
.NOTPARALLEL:

.DEFAULT_GOAL := dev

SUPABASE := npx --no-install supabase

# Portas da faixa 544xx — a 543xx padrão do CLI está ocupada por outro projeto
# Supabase nesta máquina. Os valores de verdade estão em supabase/config.toml.
STUDIO_URL := http://127.0.0.1:54423
MAIL_URL   := http://127.0.0.1:54424
APP_URL    := http://localhost:3000

# O make do Windows reinterpreta a codificação do texto que passa pela linha de
# comando do recipe, o que transforma "ação" em "aÃ§Ã£o". Mensagens com acento
# ficam em blocos marcados aqui no arquivo e o `sed` as lê byte a byte, que é o
# caminho que preserva UTF-8.
#
# `\#` é obrigatório: um `#` cru começaria um comentário e truncaria a função.
# Sem `@` aqui — ele só silencia no começo da linha do recipe, e esta função
# também é usada dentro de `if` e `{ }`, onde viraria um comando inexistente.
HASH := \#
say = sed -n 's/^$(HASH)$(1)> \{0,1\}//p' $(firstword $(MAKEFILE_LIST))

.PHONY: dev setup db-up db-migrate stop reset seed types test verify lint \
        typecheck build studio mail status clean help

## dev: sobe o ambiente local inteiro e roda a aplicação
dev: node_modules db-up .env.local db-migrate
	@$(call say,dev)
	npm run dev

#dev>
#dev>   Aplicação:       http://localhost:3000
#dev>   Studio:          http://127.0.0.1:54423
#dev>   Caixa de e-mail: http://127.0.0.1:54424
#dev>
#dev>   Entre em /entrar com um e-mail do seed e abra o link mágico na caixa
#dev>   de e-mail acima — em desenvolvimento nenhum e-mail sai da máquina.
#dev>
#dev>     admin@exemplo.local             painel administrativo
#dev>     contato@santaclara.com.br       painel da organização
#dev>     marina-e-thiago@exemplo.local   painel do cliente
#dev>

## setup: primeira execução — instala, sobe o banco e carrega o seed
setup: node_modules db-up .env.local
	npm run db:reset
	@$(call say,setup)

#setup>
#setup>   Ambiente pronto. Rode `make dev`.
#setup>

# Dependências: reinstala só quando o lockfile muda.
node_modules: package-lock.json package.json
	npm install
	@touch node_modules

## db-up: garante o Supabase local de pé (idempotente)
db-up:
	@docker info > /dev/null 2>&1 || { $(call say,docker); exit 1; }
	@if $(SUPABASE) status > /dev/null 2>&1; then \
		$(call say,up); \
	else \
		$(call say,subindo); \
		$(SUPABASE) start; \
	fi

#docker>
#docker>   Docker não está respondendo.
#docker>   Abra o Docker Desktop, espere ele terminar de iniciar e tente de novo.
#docker>
#up>   Supabase local já está de pé.
#subindo>   Subindo o Supabase local (na primeira vez ele baixa as imagens)...

# As chaves do ambiente local são geradas pelo CLI, então o .env.local sai dele
# em vez de ser copiado do .env.example à mão. Sem pré-requisito normal: o
# arquivo só é criado quando não existe, para não sobrescrever ajustes de quem
# está desenvolvendo. Ganhou variável nova no .env.example? Apague o .env.local
# e rode `make dev`.
.env.local: | db-up
	@$(call say,env)
	@eval "$$($(SUPABASE) status -o env 2>/dev/null)"; \
	{ \
		echo "# Gerado por 'make dev' a partir de 'supabase status'."; \
		echo "# Nao versionado. Apague este arquivo para regerar."; \
		echo "NEXT_PUBLIC_SUPABASE_URL=$$API_URL"; \
		echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$$ANON_KEY"; \
		echo "NEXT_PUBLIC_SITE_URL=$(APP_URL)"; \
		echo "SUPABASE_SERVICE_ROLE_KEY=$$SERVICE_ROLE_KEY"; \
		echo "SUPABASE_DB_URL=$$DB_URL"; \
		echo "APP_ENV=local"; \
	} > .env.local

#env>   Gerando .env.local a partir do ambiente local...

## db-migrate: aplica as migrations pendentes (não apaga nada)
db-migrate: | db-up
	@$(SUPABASE) migration up

## reset: recria o banco — migrations + seed. Apaga os dados locais.
reset: | db-up
	npm run db:reset

## seed: regenera supabase/seed.sql a partir dos mocks e carrega
seed: | db-up
	npm run db:seed

## types: regenera src/lib/database.types.ts a partir do schema
types: | db-up
	npm run db:types

## stop: derruba os contêineres do Supabase (os dados ficam)
stop:
	@$(SUPABASE) stop

## status: mostra as URLs e chaves do ambiente local
status:
	@$(SUPABASE) status

## studio: abre o Studio no navegador
studio:
	@start "" "$(STUDIO_URL)" 2> /dev/null || open "$(STUDIO_URL)" 2> /dev/null || \
		echo "$(STUDIO_URL)"

## mail: abre a caixa de e-mail local (o link mágico chega nela)
mail:
	@start "" "$(MAIL_URL)" 2> /dev/null || open "$(MAIL_URL)" 2> /dev/null || \
		echo "$(MAIL_URL)"

## test: testes de política de RLS e de sessão
test: node_modules .env.local | db-up
	npm test

lint: node_modules
	npm run lint

typecheck: node_modules
	npm run typecheck

build: node_modules .env.local
	npm run build

## verify: lint + tipos + build + testes (o mesmo que o CI roda)
verify: node_modules .env.local | db-up
	npm run verify

## clean: derruba os contêineres e apaga os dados do banco local
clean:
	@$(SUPABASE) stop --no-backup
	@rm -rf .next
	@$(call say,clean)

#clean>   Contêineres derrubados e .next apagado. `make setup` recomeça do zero.

## help: lista os alvos
help:
	@$(call say,help)
	@grep -E '^## ' $(firstword $(MAKEFILE_LIST)) \
		| sed -E 's/^## ([a-z-]+): /  \1|/' \
		| awk -F'|' '{ printf "  %-12s %s\n", $$1, $$2 }' \
		| sed -E 's/^ +//'
	@echo ""

#help>
#help> Alvos disponíveis:
#help>
