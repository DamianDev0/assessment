# ─── Backend ──────────────────────────────────────────
dev-api:
	cd backend && dotnet run --project src/Modules/Jobs/JobTracker.Jobs.Api/JobTracker.Jobs.Api.csproj

test-api:
	cd backend && dotnet test

build-api:
	cd backend && dotnet build

# ─── Frontend ─────────────────────────────────────────
dev-web:
	cd frontend && pnpm dev

build-web:
	cd frontend && pnpm build

test-web:
	cd frontend && pnpm test

test-e2e:
	cd frontend && pnpm test:e2e

lint:
	cd frontend && pnpm run lint

lighthouse:
	cd frontend && pnpm lighthouse

# ─── Full stack ───────────────────────────────────────
up:
	docker compose up -d --build

down:
	docker compose down

test-all:
	$(MAKE) test-api && $(MAKE) test-web

.PHONY: dev-api test-api build-api dev-web build-web test-web test-e2e lint lighthouse up down test-all
