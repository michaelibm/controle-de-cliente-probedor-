# ISP Manager — Comandos Docker
# Uso: make <comando>

.PHONY: up down build rebuild logs shell-backend shell-db seed reset ps clean

## Sobe todos os serviços
up:
	docker compose up -d

## Sobe com rebuild das imagens
build:
	docker compose up -d --build

## Para todos os serviços
down:
	docker compose down

## Para e remove volumes (CUIDADO: apaga o banco!)
reset:
	docker compose down -v
	docker compose up -d --build

## Rebuild forçado sem cache
rebuild:
	docker compose build --no-cache
	docker compose up -d

## Logs em tempo real
logs:
	docker compose logs -f

## Logs só do backend
logs-backend:
	docker compose logs -f backend

## Logs só do frontend
logs-frontend:
	docker compose logs -f frontend

## Status dos containers
ps:
	docker compose ps

## Shell no backend
shell-backend:
	docker compose exec backend sh

## Shell no PostgreSQL
shell-db:
	docker compose exec postgres psql -U $${POSTGRES_USER:-isp_user} -d $${POSTGRES_DB:-isp_manager}

## Rodar seed manualmente
seed:
	docker compose exec -e RUN_SEED=true backend sh -c "npx ts-node prisma/seed.ts"

## Rodar migration manualmente
migrate:
	docker compose exec backend npx prisma migrate deploy

## Remover imagens e volumes (limpeza total)
clean:
	docker compose down -v --rmi local
	docker volume rm isp_postgres_data 2>/dev/null || true
