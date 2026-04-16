# System Design — JobTracker

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 15)                         │
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────────────────────┐   │
│  │  App Router      │    │  Presentation Layer (FSD)                    │   │
│  │                  │    │                                              │   │
│  │  page.tsx ───────┼───►│  views/jobs/                                │   │
│  │  (Server Comp.)  │    │    ├── components/organisms/ (thin shells)  │   │
│  │  import          │    │    ├── features/                             │   │
│  │  'server-only'   │    │    │   ├── create-job/  (hook + modal)     │   │
│  │                  │    │    │   ├── filter-jobs/  (hook + compound) │   │
│  │  loading.tsx     │    │    │   └── complete-job/ (hook + modal)    │   │
│  │  error.tsx       │    │    └── hooks/use-jobs-page.hook.ts         │   │
│  │  not-found.tsx   │    │                                              │   │
│  └────────┬─────────┘    └──────────────────┬───────────────────────────┘   │
│           │ SSR fetch                       │ 'use client'                  │
│           ▼                                 ▼                               │
│  ┌─────────────────┐    ┌──────────────────────────────────────────────┐   │
│  │  Server Actions  │    │  Zustand Store                               │   │
│  │  (mutations only)│    │  - UI state (filters, selection, sort)       │   │
│  │  create-job      │    │  - Optimistic updates + rollback             │   │
│  │  complete-job    │    │  - Typed selectors (no useEffect)            │   │
│  └────────┬─────────┘    └──────────────────────────────────────────────┘   │
│           │                                                                 │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │ HTTP (fetch / Server Actions)
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (.NET 9 Modular Monolith)                    │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  API Layer (JobTracker.Jobs.Api)                                     │   │
│  │  JobsController ──► ISender (MediatR) ──► Command / Query           │   │
│  │  [ApiController] [Route("api/jobs")]                                │   │
│  └──────────────────────────────┬───────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼───────────────────────────────────────┐   │
│  │  Application Layer (JobTracker.Jobs.Application)                     │   │
│  │                                                                      │   │
│  │  WRITE PATH (Commands)              READ PATH (Queries)              │   │
│  │  ┌─────────────────────┐           ┌─────────────────────┐          │   │
│  │  │ CreateJobCommand    │           │ SearchJobsQuery     │          │   │
│  │  │ CompleteJobCommand  │           │ → Dapper (raw SQL)  │          │   │
│  │  │ ScheduleJobCommand  │           │ → IDbConnectionFactory│         │   │
│  │  │ → IJobRepository    │           │ → No EF tracking    │          │   │
│  │  │ → IUnitOfWork       │           └─────────────────────┘          │   │
│  │  └─────────┬───────────┘                                            │   │
│  │            │                                                         │   │
│  │  ┌─────────▼──────────┐  ┌──────────────────────────────────┐       │   │
│  │  │ ValidationBehavior │  │ FluentValidation Validators      │       │   │
│  │  │ (MediatR Pipeline) │  │ CreateJobCommandValidator        │       │   │
│  │  └────────────────────┘  │ CompleteJobCommandValidator      │       │   │
│  │                          └──────────────────────────────────┘       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼───────────────────────────────────────┐   │
│  │  Domain Layer (JobTracker.Jobs.Domain)                               │   │
│  │                                                                      │   │
│  │  Job (AggregateRoot)    Address (ValueObject)    JobPhoto (Entity)  │   │
│  │  ├── Create()           ├── Create()             └── Create()       │   │
│  │  ├── Schedule()         └── GetAtomicValues()        (internal)     │   │
│  │  ├── Start()                                                        │   │
│  │  ├── Complete() ──► JobCompletedDomainEvent                         │   │
│  │  ├── Cancel()   ──► JobCancelledDomainEvent                         │   │
│  │  └── AddPhoto()                                                     │   │
│  │                                                                      │   │
│  │  IJobRepository (interface)    Result<T> / Error (Shared.Domain)    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼───────────────────────────────────────┐   │
│  │  Infrastructure Layer (JobTracker.Jobs.Infrastructure)               │   │
│  │                                                                      │   │
│  │  JobsDbContext          JobRepository (partial)                      │   │
│  │  ├── Schema "jobs"      ├── JobRepository.cs (CRUD)                 │   │
│  │  ├── OwnsOne(Address)   └── JobRepository.Search.cs (search)        │   │
│  │  ├── snake_case                                                     │   │
│  │  └── enum as string    UnitOfWork → SaveChangesAsync()              │   │
│  │                                                                      │   │
│  │  InsertOutboxMessagesInterceptor                                    │   │
│  │  └── SavingChangesAsync: serialize DomainEvents → outbox_messages   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
            ┌──────────────────────▼──────────────────────┐
            │         ASYNC PIPELINE                       │
            │                                              │
            │  outbox_messages ──► Hangfire (every 1 min)  │
            │                      │                       │
            │  ProcessOutboxMessagesJob:                    │
            │  1. Poll WHERE processed_on IS NULL           │
            │  2. Deserialize event type                   │
            │  3. Publish via IPublisher (MediatR)         │
            │  4. Mark processed_on = NOW()                │
            │                      │                       │
            │                      ▼                       │
            │  ┌───────────────────────────────────┐       │
            │  │ JobCompletedDomainEventHandler    │       │
            │  │ → creates IntegrationEvent        │       │
            │  │ → publishes to other modules      │       │
            │  └──────────┬────────────────────────┘       │
            │             │                                │
            │    ┌────────▼────────┐  ┌────────────────┐   │
            │    │ Billing Module  │  │ Notifications  │   │
            │    │ (invoice gen)   │  │ (SendGrid)     │   │
            │    │ idempotency key │  │                │   │
            │    └─────────────────┘  └────────────────┘   │
            └──────────────────────────────────────────────┘
                                   │
            ┌──────────────────────▼──────────────────────┐
            │         PostgreSQL 16                         │
            │                                              │
            │  Schema: jobs                                │
            │  ├── jobs.jobs          (aggregate)          │
            │  ├── jobs.job_photos    (entity)             │
            │  └── jobs.outbox_messages (outbox)           │
            │                                              │
            │  Indexes:                                    │
            │  ├── idx_jobs_org_id        (tenant)         │
            │  ├── idx_jobs_org_status    (composite)      │
            │  ├── idx_jobs_org_date      (date range)     │
            │  ├── idx_jobs_org_assignee  (assignee)       │
            │  ├── idx_jobs_fts           (GIN, FTS)       │
            │  └── idx_outbox_unprocessed (partial)        │
            └──────────────────────────────────────────────┘
```

---

## 2. SOLID Principles — Concrete Examples

### S — Single Responsibility Principle

**`CreateJobCommandHandler`** (`Jobs.Application/Jobs/Commands/CreateJob/CreateJobCommandHandler.cs`)

This handler has exactly one responsibility: orchestrate the creation of a Job. It does NOT validate (that's `CreateJobCommandValidator` via the pipeline), does NOT persist directly (delegates to `IJobRepository`), and does NOT handle HTTP (that's the controller). Each class has one reason to change.

### O — Open/Closed Principle

**`ValidationBehavior<TRequest, TResponse>`** (`Jobs.Application/Behaviors/ValidationBehavior.cs`)

The MediatR pipeline is open for extension (add new validators for any command) but closed for modification (the behavior itself never changes). Adding validation to `ScheduleJobCommand` only requires creating a new `ScheduleJobCommandValidator` — zero changes to existing code.

### L — Liskov Substitution Principle

**`IJobRepository` / `JobRepository`** (`Jobs.Domain/Repositories/IJobRepository.cs` → `Jobs.Infrastructure/Repositories/JobRepository.cs`)

Any implementation of `IJobRepository` can replace `JobRepository` without breaking callers. The handlers depend on the interface, and in tests we substitute with `Mock<IJobRepository>` — the handlers behave identically because the contract is respected.

### I — Interface Segregation Principle

**`IUnitOfWork`** vs **`IJobRepository`** (`Jobs.Application/Abstractions/`)

Instead of one fat `IRepository<T>` with `SaveChanges + Add + Search + GetById`, we segregate into:
- `IJobRepository` — domain-specific queries (`GetByIdAsync`, `AddAsync`, `SearchAsync`)
- `IUnitOfWork` — persistence concern (`SaveChangesAsync`)
- `IDbConnectionFactory` — read-path connection for Dapper queries

Handlers only depend on what they need. `SearchJobsQueryHandler` depends only on `IDbConnectionFactory`, not on `IJobRepository` or `IUnitOfWork`.

### D — Dependency Inversion Principle

**Domain defines `IJobRepository`, Infrastructure implements `JobRepository`**

The domain layer (high-level) defines the repository interface. The infrastructure layer (low-level) provides the EF Core implementation. Both depend on the abstraction (`IJobRepository`), not on each other. The domain never references `Microsoft.EntityFrameworkCore` — verified by architecture tests.

---

## 3. GRASP Principles — Concrete Examples

### Information Expert

**`Job.Complete()`** — The `Job` aggregate owns all the data needed to decide if completion is valid (current `Status`, transition rules). It doesn't ask an external service — it makes the decision itself because it has the information.

### Creator

**`Job.Create()` static factory method** — The `Job` aggregate creates itself because it has the initializing data and enforces invariants at creation time. Similarly, `Job.AddPhoto()` creates `JobPhoto` instances because the `Job` owns the photos collection and controls access.

### Controller (GRASP)

**`JobsController`** — Acts as the coordinator between the HTTP boundary and the application layer. It doesn't contain business logic — it translates HTTP requests into Commands/Queries and translates Results back to HTTP responses.

### Low Coupling

**`JobTracker.Jobs.IntegrationEvents`** — This project has ZERO dependencies on Domain or Application. Other modules (Billing) depend only on this thin contract project, not on the Jobs module internals. The Billing module never imports `Job.cs` or `JobRepository.cs`.

### High Cohesion

**Feature-per-folder in Application** — Each command lives in its own folder (`CreateJob/`, `CompleteJob/`) containing the Command, Handler, and Validator. Everything related to "creating a job" lives together, nothing unrelated is mixed in.

---

## 4. GoF Design Patterns

| Pattern | Where Used | Problem Solved |
|---------|-----------|---------------|
| **Repository** | `IJobRepository` (Domain) + `JobRepository` (Infrastructure) | Abstracts persistence behind a domain interface. Enables unit testing with mocks and allows swapping EF Core for Dapper without touching domain code. |
| **Unit of Work** | `IUnitOfWork` + `UnitOfWork` wrapping `JobsDbContext.SaveChangesAsync()` | Ensures all changes within a use case are committed atomically in a single transaction. Combined with the outbox interceptor, guarantees domain events are persisted alongside aggregate mutations. |
| **Observer** | Domain Events (`JobCompletedDomainEvent` → `JobCompletedDomainEventHandler`) via MediatR `IPublisher` | Decouples the aggregate from side effects. The `Job` raises an event; handlers (invoice generation, notifications) react independently. Adding a new handler requires zero changes to the `Job` aggregate. |
| **Factory Method** | `Job.Create()`, `Address.Create()`, `JobPhoto.Create()` | Encapsulates construction logic and invariant validation. Prevents invalid objects from being instantiated by returning `Result<T>` instead of throwing. The private constructor enforces that creation always goes through the factory. |
| **Mediator** | MediatR as `ISender` / `IPublisher` | The controller doesn't know which handler processes a command. MediatR routes `CreateJobCommand` to `CreateJobCommandHandler` transparently. This decouples the API layer from the Application layer — adding a new command requires no changes to the controller routing. |
| **Command** (behavioral) | `CreateJobCommand`, `CompleteJobCommand`, etc. as `IRequest<Result<T>>` | Encapsulates a request as an object, allowing parameterization, queuing, and pipeline decoration (validation). Each command is a self-contained, immutable description of what should happen. |
| **Strategy** | `FluentValidation` validators injected into `ValidationBehavior` via `IEnumerable<IValidator<T>>` | Different validation strategies are applied per command type without modifying the pipeline. `CreateJobCommandValidator` and `CompleteJobCommandValidator` are interchangeable strategies selected by the generic type parameter. |
| **Template Method** | `ValueObject.Equals()` calls abstract `GetAtomicValues()` | The base `ValueObject` class defines the equality algorithm (template), and concrete value objects (`Address`) provide the specific atomic values. This ensures all value objects get consistent structural equality without duplicating the Equals/GetHashCode logic. |

---

## 5. DDD Concepts

### Bounded Contexts

The Jobs module is a bounded context with clear boundaries. It owns its database schema (`jobs.*`), its domain model (`Job`, `Address`, `JobPhoto`), and its public contracts (`JobTracker.Jobs.IntegrationEvents`). The Billing module is a separate bounded context that communicates with Jobs exclusively through integration events — never through direct database access or shared domain models.

### Open Host Service (OHS) / Published Language

The `JobTracker.Jobs.IntegrationEvents` project IS the Open Host Service. It's a separate assembly with zero dependencies on the Jobs domain. Other modules reference only this project to subscribe to events like `JobCompletedIntegrationEvent`. This is the "published language" — a stable contract that can evolve independently from the internal domain model.

### Domain Events vs Integration Events

- **Domain Events** (`JobCompletedDomainEvent`): Internal to the Jobs module. Published synchronously via MediatR within the same process. They trigger side effects that belong to this bounded context (e.g., creating the integration event).
- **Integration Events** (`JobCompletedIntegrationEvent`): Cross bounded context boundaries. They travel through the outbox and Hangfire pipeline asynchronously. They are the public contracts consumed by Billing and Notifications.

### Eventual Consistency

When a Job is completed:
1. `Job.Complete()` raises `JobCompletedDomainEvent`
2. `InsertOutboxMessagesInterceptor` serializes it to `outbox_messages` in the **same transaction**
3. Hangfire polls the outbox every minute and publishes to handlers
4. The Billing module creates an invoice **asynchronously**

The invoice is NOT created in the same transaction as the Job completion. There's a window (up to ~1 minute) where the Job is Completed but the invoice doesn't exist yet. This is eventual consistency — the system converges to a consistent state, but not instantaneously.

### Idempotency

The `JobCompletedIntegrationEvent` carries an `IdempotencyKey`: `"{JobId}-{CompletedAt:yyyyMMdd}"`. The Billing module's invoice handler checks this key before creating an invoice:

```
IF EXISTS (SELECT 1 FROM billing.invoices WHERE idempotency_key = @key) → skip
ELSE → create invoice
```

This guarantees that even if Hangfire delivers the same event multiple times (crash recovery, retry), only one invoice is ever created per job completion. At-least-once delivery + idempotent consumers = exactly-once semantics.
