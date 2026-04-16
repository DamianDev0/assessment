# JobTracker

Multi-tenant job management system for a roofing company.

## Setup

```bash
docker compose up -d postgres

cd backend
dotnet run --project src/Modules/Jobs/JobTracker.Jobs.Api/JobTracker.Jobs.Api.csproj --launch-profile Development

cd frontend
pnpm install && pnpm dev
```

- **API:** http://localhost:5050/api/jobs
- **Swagger:** http://localhost:5050/swagger
- **Frontend:** http://localhost:3000/jobs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js)                        │
│                                                                 │
│  Server Components ──> Client Components ──> Zustand Store      │
│  (RSC + fetch)         ('use client')        (UI state only)    │
│                         thin shells          selectors,         │
│                                              optimistic update  │
│                                                                 │
│  core/                                                          │
│  ├── domain/entities/    (framework-agnostic types)             │
│  ├── infrastructure/     (axios services)                       │
│  └── shared/             (enums, utils)                         │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP (REST)
┌────────────────────────────────▼────────────────────────────────┐
│                       BACKEND (.NET 9)                          │
│                                                                 │
│  API ──> Application ──> Domain                                 │
│  Controller  Commands     Aggregate (Job)                       │
│              Queries      ValueObject (Address)                 │
│              Validators   Events                                │
│                                                                 │
│  Infrastructure                                                 │
│  ├── EF Core + Npgsql                                          │
│  ├── Outbox Interceptor (same-tx event persistence)            │
│  └── Hangfire (background processing)                          │
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
│  PostgreSQL — Schema: "jobs"                                    │
│  ├── jobs (owned Address, status string, xmin concurrency)      │
│  ├── job_photos (FK cascade)                                    │
│  ├── outbox_messages (JSONB, partial index on unprocessed)      │
│  └── Indexes: org+status, org+date, org+assignee, GIN FTS      │
└─────────────────────────────────────────────────────────────────┘
```

## Architectural Decisions

**Modular Monolith over Microservices** — Clean module boundaries without distributed systems complexity. Jobs, Billing, Notifications can be extracted later.

**Outbox Pattern** — Events persisted in the same transaction as the aggregate mutation. If the process crashes, events are never lost (at-least-once delivery).

**Cursor-Based Pagination** — OFFSET scans and discards N rows O(N). Cursor uses the index directly O(log N) via `(created_at, id) < (cursor)`.

**Result Pattern** — No exceptions for business logic. Failure is explicit in the return type.

**DDD in Frontend (core/)** — Domain logic isolated from React. If we migrate frameworks, `core/` doesn't change.

### Denormalization Analysis

**Denormalize customer_name into jobs when:** read-heavy queries need it, historical accuracy matters (job was for "Acme Corp" even if customer renames).

**Use integration events when:** value changes frequently, stale reads are unacceptable, multiple consumers need the update.

**Trade-offs:** Denormalization gives consistency at write time but staleness on updates. Integration events give eventual consistency with decoupled modules but require idempotent consumers.

## SOLID — Concrete Examples

| Principle | Example |
|-----------|---------|
| **S** | `CreateJobCommandHandler` only orchestrates. Validation is in `CreateJobCommandValidator`. Persistence in `IJobRepository`. Events in `OutboxInterceptor`. |
| **O** | `ValidationBehavior<TRequest, TResponse>` is open for extension (add validators) closed for modification. |
| **L** | `JobRepository` implements `IJobRepository`. Tests use mocks — same interface, different implementation. |
| **I** | `IJobRepository` defines only domain needs. `IUnitOfWork` handles persistence separately. |
| **D** | Domain defines `IJobRepository`. Infrastructure implements it. Domain never references EF Core (NetArchTest verified). |

## GRASP — Concrete Examples

| Principle | Example |
|-----------|---------|
| **Information Expert** | `Job` aggregate validates its own state transitions. |
| **Creator** | `Job.Create()` factory method. `JobPhoto.Create()` is internal. |
| **Controller** | `JobsController` maps HTTP to MediatR commands. Zero business logic. |
| **Low Coupling** | Jobs → Billing via `JobCompletedIntegrationEvent` only. |
| **High Cohesion** | Each FSD feature slice (create-job, complete-job) is self-contained. |

## GoF Design Patterns

| Pattern | Where | Problem Solved |
|---------|-------|----------------|
| Repository | `IJobRepository` + `JobRepository` | Abstracts persistence, enables mocks |
| Unit of Work | `IUnitOfWork` + `UnitOfWork` | Single transaction for persistence + events |
| Observer | Domain Events + `INotificationHandler` | Decouples side effects from aggregate |
| Factory Method | `Job.Create()`, `Address.Create()` | Enforces invariants, returns Result |
| Mediator | MediatR `ISender` / `IPublisher` | Decouples controllers from handlers |
| Builder | `QueryBuilder<T>` | Type-safe query construction with narrowing |
| Strategy | FluentValidation validators | Swappable validation per command |
| Command | `CreateJobCommand`, `CompleteJobCommand` | Mutation intent as serializable object |
| State | `JobStatus` transitions | Valid state machine with Result pattern |
| Compound | `FilterBar.Status`, `FilterBar.DateRange` | Context-based state without prop drilling |

## DDD Concepts

**Bounded Contexts** — Jobs and Billing are separate modules communicating via integration events.

**Open Host Service** — `Jobs.IntegrationEvents` is the published language. Other modules depend only on this project.

**Domain vs Integration Events** — Domain events are internal (in-process). Integration events cross boundaries (via outbox).

**Eventual Consistency** — Job completion triggers invoice generation within ~1 minute via Hangfire.

**Idempotency** — Invoice handler uses `idempotency_key = "{JobId}-{CompletedAt:yyyyMMdd}"`. Duplicate deliveries create zero duplicate invoices.

## What I Would Improve

- Technicians module with dropdown for assignee selection
- Dapper for read-optimized SearchJobsQueryHandler
- OpenTelemetry distributed tracing
- Rate limiting middleware (sliding window)
- Real authentication with JWT + multi-tenant middleware
