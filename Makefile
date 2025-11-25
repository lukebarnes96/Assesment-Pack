.PHONY: help install dev build start stop clean db-setup db-migrate db-studio

help:
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development servers"
	@echo "  make build      - Build all applications"
	@echo "  make start      - Start production with Docker"
	@echo "  make stop       - Stop Docker containers"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make db-setup   - Setup database"
	@echo "  make db-migrate - Run database migrations"
	@echo "  make db-studio  - Open Prisma Studio"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	docker-compose up -d

stop:
	docker-compose down

clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/*/.next
	rm -rf apps/*/dist
	rm -rf apps/*/build
	rm -rf .turbo

db-setup:
	cd packages/database && npx prisma generate && npx prisma migrate dev

db-migrate:
	cd packages/database && npx prisma migrate deploy

db-studio:
	cd packages/database && npx prisma studio
