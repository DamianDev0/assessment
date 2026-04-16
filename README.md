# JobTracker

Multi-tenant job management system for a roofing company.
**Stack:** Next.js 15 (App Router) + .NET 9 + PostgreSQL 16.

---

## Quick Start

### Option A — Full stack (Docker)

```bash
docker compose up -d --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000/jobs |
| API      | http://localhost:5050/api/jobs |
| Swagger  | http://localhost:5050/swagger |
| Hangfire | http://localhost:5050/hangfire |

### Option B — Development (manual)

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. Backend
cd backend
dotnet run --project src/Modules/Jobs/JobTracker.Jobs.Api/JobTracker.Jobs.Api.csproj

# 3. Frontend
cd frontend
cp .env.example .env.local   # adjust if needed
pnpm install && pnpm dev
```

### Environment Variables

See [`frontend/.env.example`](frontend/.env.example) for all required variables. Key ones:

| Variable | Purpose | Default |
|----------|---------|---------|
| `API_URL` | Backend URL for Server Components (server-side) | `http://localhost:5050` |
| `NEXT_PUBLIC_API_URL` | Backend URL for client-side Axios | `http://localhost:5050` |
| `NEXT_PUBLIC_ORG_ID` | Default tenant for multi-tenant isolation | `00000000-...-000001` |
| `NEXT_PUBLIC_DEFAULT_CUSTOMER_ID` | Pre-filled customer in Create Job modal | `00000000-...-000002` |

---

## Running Tests

```bash
# Backend (39 tests: domain + application + architecture)
cd backend && dotnet test

# Frontend unit tests (32 tests: store, hooks, types, job-state)
cd frontend && pnpm test

# E2E Playwright (5 tests — requires docker stack running)
cd frontend && pnpm test:e2e

# Lighthouse CI (requires docker stack running)
cd frontend && pnpm lighthouse
```

### Test Coverage

| Suite | Count | What it covers |
|-------|-------|----------------|
| xUnit Domain | 20 | Job aggregate invariants, Address equality, state transitions |
| xUnit Application | 12 | CreateJob/CompleteJob handlers with Moq, FluentAssertions |
| xUnit Architecture | 7 | NetArchTest: layer deps, naming conventions, sealed handlers |
| Vitest Unit | 32 | Zustand store, useCreateJob hook, DeepReadonly/PathKeys types, JobState transitions |
| Playwright E2E | 5 | Load table, open/cancel modal, validation, status filter, search |

### Lighthouse Scores (local, `/jobs` with real data)

| Performance | Accessibility | Best Practices | SEO |
|-------------|---------------|----------------|-----|
| 100 | 95 | 100 | 100 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js 15)                     │
│                                                                 │
│  app/jobs/page.tsx (Server Component, server-only)              │
│    └─> container.getJobsUseCase.execute()                       │
│          └─> passes data as props to <JobsClient> (thin shell)  │
│                                                                 │
│  core/ (Clean Architecture — DDD lite)                          │
│  ├── domain/           entities, repository interfaces          │
│  ├── application/      use-cases/jobs/ (one per operation)      │
│  ├── infrastructure/   repository impls, services, container/   │
│  └── shared/           enums, utils, types                      │
│                                                                 │
│  presentation/ (Feature Sliced Design + Atomic Design)          │
│  └── views/jobs/                                                │
│      ├── features/     create-job, complete-job, schedule-job,  │
│      │                 filter-jobs (verb slices)                 │
│      ├── hooks/        useJobsPage (orchestration)              │
│      └── components/   thin shell organisms                     │
│                                                                 │
│  store/ (Zustand + immer)                                       │
│  └── jobs.store.ts     UI state, selectors, optimistic updates  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP (REST)
┌────────────────────────────────▼────────────────────────────────┐
│                       BACKEND (.NET 9)                          │
│                                                                 │
│  API ──> Application ──> Domain                                 │
│  Controller  Commands     Aggregate (Job)                       │
│              Queries      ValueObject (Address)                 │
│              Validators   Entity (JobPhoto)                     │
│                           Events                                │
│                                                                 │
│  Infrastructure                                                 │
│  ├── EF Core 9 + Npgsql (snake_case, schema "jobs")            │
│  ├── Dapper (read-optimized SearchJobsQueryHandler)             │
│  ├── Outbox Interceptor (same-tx event persistence)            │
│  ├── Hangfire (background job processing)                      │
│  ├── Rate Limiting (sliding window, 100 req/min per tenant)    │
│  └── OpenTelemetry (ASP.NET Core + EF Core + HTTP traces)      │
│                                                                 │
│  IntegrationEvents (public contracts for other modules)         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                       ASYNC PIPELINE                            │
│                                                                 │
│  Job.Complete()                                                 │
│    └─> JobCompletedDomainEvent                                  │
│          └─> OutboxInterceptor (persisted in same transaction)  │
│                └─> outbox_messages table                        │
│                      └─> ProcessOutboxJob (Hangfire, minutely)  │
│                            ├─> Invoice Generation (Billing)     │
│                            └─> Customer Notification            │
│                                 (idempotency: {JobId}-{date})   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│  PostgreSQL 16 — Schema: "jobs"                                 │
│  ├── jobs (owned Address, status as string, tenant isolation)   │
│  ├── job_photos (FK cascade)                                    │
│  ├── outbox_messages (JSONB, partial index on unprocessed)      │
│  └── Indexes: org+status, org+date, org+assignee, GIN FTS      │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend DDD Flow (detailed)

See [docs/ddd-frontend-flow.md](docs/ddd-frontend-flow.md) for the complete walkthrough:
- SSR flow: from user navigating `/jobs` to pixels on screen
- Mutation flow: from "Complete Job" click to optimistic update + rollback
- Why each layer exists and the dependency direction rules

### Key Dependency Rule

```
presentation ──> container ──> application ──> domain (interfaces)
                                                    ▲
                               infrastructure ──────┘
                               (implements)
```

Domain has zero dependencies. Infrastructure implements domain interfaces. The container is the only file that wires implementations to interfaces.

---

## Architectural Decisions

**Modular Monolith over Microservices** — Clean module boundaries without distributed systems complexity. Jobs, Billing, Notifications can be extracted later.

**Outbox Pattern** — Events persisted in the same transaction as the aggregate mutation. If the process crashes, events are never lost (at-least-once delivery).

**Cursor-Based Pagination** — OFFSET scans and discards N rows O(N). Cursor uses the index directly O(log N) via `(created_at, id) < (cursor)`.

**Result Pattern** — No exceptions for business logic. Failure is explicit in the return type.

**Clean Architecture in Frontend** — Use cases + DI container on both server (RSC) and client (browser). Hooks consume use cases, never services directly. If we swap Axios for fetch, only `JobRepositoryImpl` changes.

**Two DI Containers (server + client)** — Server container uses `fetch` + `server-only`. Client container uses Axios. Separated to prevent server code from leaking into the browser bundle.

**Feature Sliced Design** — Features organized by business verb (create-job, complete-job), not by file type. Each slice is self-contained with hooks, components, and barrel exports.

**Thin Shell Organisms** — Components receive all state and handlers via props. Logic lives exclusively in hooks. Enables testing hooks without rendering UI.

### Denormalization Analysis

**Denormalize customer_name into jobs when:** read-heavy queries need it, historical accuracy matters (job was for "Acme Corp" even if customer renames).

**Use integration events when:** value changes frequently, stale reads are unacceptable, multiple consumers need the update.

**Trade-offs:** Denormalization gives consistency at write time but staleness on updates. Integration events give eventual consistency with decoupled modules but require idempotent consumers.

---

## Design Principles

### SOLID

| Principle | Example |
|-----------|---------|
| **S** | `CreateJobCommandHandler` only orchestrates. Validation in `CreateJobCommandValidator`. Persistence in `IJobRepository`. Events in `OutboxInterceptor`. |
| **O** | `ValidationBehavior<TRequest, TResponse>` is open for extension (add validators) closed for modification. |
| **L** | `JobRepository` implements `IJobRepository`. Tests use mocks — same interface, different implementation. |
| **I** | `IJobRepository` defines only domain needs. `IUnitOfWork` handles persistence separately. |
| **D** | Domain defines `IJobRepository`. Infrastructure implements it. Domain never references EF Core (NetArchTest verified). |

### GRASP

| Principle | Example |
|-----------|---------|
| **Information Expert** | `Job` aggregate validates its own state transitions. |
| **Creator** | `Job.Create()` factory method. `JobPhoto.Create()` is internal. |
| **Controller** | `JobsController` maps HTTP to MediatR commands. Zero business logic. |
| **Low Coupling** | Jobs → Billing via `JobCompletedIntegrationEvent` only. |
| **High Cohesion** | Each FSD feature slice (create-job, complete-job) is self-contained. |

### GoF Design Patterns

| Pattern | Where | Problem Solved |
|---------|-------|----------------|
| Repository | `IJobRepository` + `JobRepository` | Abstracts persistence, enables mocks |
| Unit of Work | `IUnitOfWork` + `UnitOfWork` | Single transaction for persistence + events |
| Observer | Domain Events + `INotificationHandler` | Decouples side effects from aggregate |
| Factory Method | `Job.Create()`, `Address.Create()` | Enforces invariants, returns Result |
| Mediator | MediatR `ISender` / `IPublisher` | Decouples controllers from handlers |
| Builder | `QueryBuilder<T>` (TypeScript) | Type-safe query construction with narrowing |
| Strategy | FluentValidation validators | Swappable validation per command |
| Command | `CreateJobCommand`, `CompleteJobCommand` | Mutation intent as serializable object |
| State | `JobStatus` transitions | Valid state machine with Result pattern |
| Compound | `FilterBar.Status`, `FilterBar.DateRange` | Context-based state without prop drilling |

### DDD Concepts

**Bounded Contexts** — Jobs and Billing are separate modules communicating via integration events.

**Open Host Service** — `Jobs.IntegrationEvents` is the published language. Other modules depend only on this project.

**Domain vs Integration Events** — Domain events are internal (in-process). Integration events cross boundaries (via outbox).

**Eventual Consistency** — Job completion triggers invoice generation within ~1 minute via Hangfire.

**Idempotency** — Invoice handler uses `idempotency_key = "{JobId}-{CompletedAt:yyyyMMdd}"`. Duplicate deliveries create zero duplicate invoices.

---

## Bonus Features

| Feature | Implementation |
|---------|---------------|
| **CI/CD** | GitHub Actions: frontend (lint+test+build), backend (test+build), Lighthouse, E2E with Playwright |
| **OpenTelemetry** | Backend: ASP.NET Core + EF Core + HTTP traces, OTLP export. Frontend: `@vercel/otel` in `instrumentation.ts` |
| **Rate Limiting** | Sliding window: 100 req/min per tenant (`X-Organization-Id`), fallback to IP. 6 segments. Returns 429. |
| **Accessibility** | ARIA labels, keyboard navigation, WCAG AA contrast. Lighthouse a11y ≥ 90 as CI gate. |
| **Lighthouse** | CI job runs against docker stack. Scores: Perf 100, A11y 95, BP 100, SEO 100. |

---

## What I Would Improve

- Real authentication with JWT + multi-tenant middleware
- Customers module with dropdown for assignee/customer selection
- WebSocket for real-time job status updates
- React.cache + preload pattern for parallel data fetching
- Pagination UI with infinite scroll or "Load more"
