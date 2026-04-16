# DDD en el frontend — flujo completo

Explica las capas del frontend, cómo se comunican y qué pasa desde que el usuario hace click hasta que React pinta el pixel.

---

## Mapa de capas

```
┌────────────────────────────────────────────────────────┐
│ PRESENTATION  — React, Next.js                         │
│   app/jobs/page.tsx          (Server Component)        │
│   presentation/views/jobs/   (FSD: views/features)     │
│   store/jobs.store.ts        (Zustand UI state)        │
└────────────┬───────────────────────────────────────────┘
             │ import
             ▼
┌────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE/CONTAINER  — composición (DI)           │
│   server-container.ts  (RSC, server-only)              │
│   client-container.ts  (browser)                       │
└────────────┬───────────────────────────────────────────┘
             │ expone
             ▼
┌────────────────────────────────────────────────────────┐
│ APPLICATION  — use cases (casos de uso)                │
│   GetJobsUseCase, CreateJobUseCase, CompleteJobUseCase │
│   recibe un Repository por CONSTRUCTOR                 │
└────────────┬───────────────────────────────────────────┘
             │ depende de INTERFACE
             ▼
┌────────────────────────────────────────────────────────┐
│ DOMAIN  — el corazón, sin dependencias                 │
│   entities: Job, Address, JobStatus                    │
│   repositories INTERFACES: JobRepository,              │
│                            JobServerRepository         │
└────────────▲───────────────────────────────────────────┘
             │ implementa
┌────────────┴───────────────────────────────────────────┐
│ INFRASTRUCTURE  — implementaciones                     │
│   JobRepositoryImpl        → jobService (Axios)        │
│   JobServerRepositoryImpl  → fetch (server-only)       │
│   jobService (infra service — Axios wrapper)           │
└────────────────────────────────────────────────────────┘
```

**Regla de oro:** las flechas de dependencia **siempre apuntan hacia adentro** (hacia Domain). Domain no sabe que existe EF, Axios, React, nada.

---

## Flujo 1 — Lectura inicial (SSR, usuario entra a `/jobs`)

### Paso 1 — Usuario navega a `/jobs`

El browser hace GET a Next.js. Next detecta que hay un `app/jobs/page.tsx` y lo ejecuta **en el server**.

### Paso 2 — `app/jobs/page.tsx` (Server Component)

```ts
import 'server-only'
import { container } from '@/core/infrastructure/container/server-container'

export default async function JobsPage() {
  const response = await container.getJobsUseCase.execute()
  ...
}
```

Es un Server Component **async** — se puede hacer `await` directo. El `import 'server-only'` explota en build si este código se bundleara al cliente.

### Paso 3 — `server-container.ts` resuelve el use case

```ts
get getJobsUseCase(): GetJobsUseCase {
  this._getJobsUseCase ??= new GetJobsUseCase(this.jobRepository)
  return this._getJobsUseCase
}
```

Lazy-init: la primera vez crea `JobServerRepositoryImpl(API_URL, ORG_ID)`, luego crea `GetJobsUseCase(repo)`. Segunda llamada reusa la instancia.

### Paso 4 — `GetJobsUseCase.execute()`

```ts
execute(params?) { return this.repository.list(params) }
```

El use case **no sabe cómo** se listan los jobs. Solo le dice al repo "listá". Este es el punto donde una regla de negocio (validar permisos, aplicar defaults) podría vivir.

### Paso 5 — `JobServerRepositoryImpl.list()`

```ts
async list(params) {
  const res = await fetch(`${this.apiUrl}/api/jobs?...`, {
    headers: { 'X-Organization-Id': this.organizationId },
    next: { revalidate: 0 },
  })
  return res.json()
}
```

`fetch` nativo (no Axios) — corre en el server. `revalidate: 0` = sin cache. Retorna `CursorPage<Job>`.

### Paso 6 — El response vuelve al `page.tsx`

```tsx
return (
  <Suspense fallback={<JobsSkeleton />}>
    <JobsClient initialJobs={response.items} ... />
  </Suspense>
)
```

Next.js **serializa** el JSX + los jobs y lo envía al browser como HTML + un payload RSC.

### Paso 7 — Hidratación en el browser

El browser recibe el HTML ya pintado (SSR) y el payload del RSC. React hidrata el árbol. `<JobsClient>` tiene `'use client'` — ahora corre en el browser.

### Paso 8 — `JobsClient` llama `useJobsPage(initialJobs)`

```ts
useEffect(() => { setJobs(initialJobs) }, [initialJobs, setJobs])
```

Mete los jobs del server en el **Zustand store**. El store es la fuente de UI state.

### Paso 9 — Selectores + render

```ts
const jobs = useJobsStore(useShallow(selectFilteredJobs))
const filters = useJobsStore(selectFilters)
```

Se pasan al `<DataTable>` envuelto en `<ErrorBoundary>` → React pinta las filas.

**Fin flujo de lectura.**

---

## Flujo 2 — Mutación (usuario clickea "Complete Job")

### Paso 1 — Click en "Complete" de una fila

`jobs-client.component.tsx` recibe la acción vía `onRowAction={handleRowAction}`. El hook `useJobsPage` dispatcha:

```ts
handleRowAction('complete', job)  →  completeJob.openModal(job.id)
```

### Paso 2 — Modal abre

`useCompleteJob` (feature slice) mantiene `selectedJobId` + `isModalOpen` con `useState`. Renderiza el `<CompleteJobModal>`.

### Paso 3 — Usuario firma + submit

```ts
handleSubmit: (signatureUrl) => {
  if (!selectedJobId) return
  mutation.mutate({ jobId: selectedJobId, signatureUrl })  // jobId explícito (no closure)
}
```

### Paso 4 — React Query dispara `onMutate` ANTES del fetch

```ts
onMutate: ({ jobId }) => {
  const previousStatus = useJobsStore.getState().jobs.find(j => j.id === jobId)?.status ?? null
  updateJobStatusOptimistic(jobId, JobStatus.COMPLETED)   // UI cambia AHORA
  return { previousStatus }                                // se guarda en context
}
```

**Optimistic update**: la fila ya muestra "Completed" aunque el server no respondió.

### Paso 5 — `mutationFn` corre la llamada real

```ts
mutationFn: ({ jobId, signatureUrl }) =>
  clientContainer.completeJob.execute(jobId, { signatureUrl })
```

### Paso 6 — `client-container.ts` resuelve el use case

```ts
get completeJob(): CompleteJobUseCase {
  this._completeJob ??= new CompleteJobUseCase(this.jobRepository)
  return this._completeJob
}
```

### Paso 7 — `CompleteJobUseCase.execute()`

```ts
execute(jobId, data) { return this.repository.complete(jobId, data) }
```

### Paso 8 — `JobRepositoryImpl.complete()`

```ts
complete(jobId, data) { return jobService.complete(jobId, data) }
```

### Paso 9 — `jobService` usa Axios

```ts
await api.post(`/jobs/${jobId}/complete`, request)
```

HTTP POST al backend .NET.

### Paso 10a — Éxito

```ts
onSuccess: () => {
  setIsModalOpen(false)
  sileo.success({ ... })
  onSuccess()              // handleMutationSuccess
}
```

`handleMutationSuccess` = `router.refresh()` → **Next re-ejecuta `page.tsx` en el server** (flujo 1 completo de nuevo) → state fresco del backend. El optimistic update era para no esperar; ahora llega el dato real.

### Paso 10b — Error

```ts
onError: (error, variables, context) => {
  if (context?.previousStatus) rollbackJobStatus(variables.jobId, context.previousStatus)
  // vuelve al status REAL que estaba (no a un valor hardcodeado)
  sileo.error({ ... })
}
```

React Query pasa el `context` que retornó `onMutate`, así el rollback es exacto.

**Fin flujo de mutación.**

---

## Por qué cada capa existe

| Capa | ¿Por qué? |
|------|-----------|
| **Domain** | Sin dependencias = testeable puro, portable. Si cambia EF por Mongo o Axios por fetch, domain no se entera. |
| **Application (use cases)** | Un use case = una operación de negocio. Orquesta el flujo (validar → persistir → eventos). El hook no llama al repo — llama al use case. |
| **Infrastructure** | Implementa lo que Domain pide. Si mañana cambiás Axios por TanStack Query, solo cambiás el Impl. |
| **Container** | **Composition Root** — el único lugar que sabe qué implementación va con qué interface. Todo el resto depende de abstracciones. |
| **Presentation (hooks + componentes)** | UI. Consume use cases del container. No conoce HTTP, no conoce el backend. |
| **Store (Zustand)** | UI state derivado del server (no duplica). Optimistic updates, filtros activos, selección de filas. |

---

## Dependencias — quién importa a quién

```
presentation  ──► container  ──► application  ──► domain (interfaces)
                                                       ▲
                                  infrastructure ──────┘
                                  (implementa)
```

- `presentation` importa `container` y `use-cases` (tipos).
- `container` importa `application` (use cases) e `infrastructure` (impls).
- `application` importa solo `domain` (entities + interfaces).
- `infrastructure` importa `domain` (para implementar interfaces).
- `domain` no importa a nadie.

---

## Dos contenedores, dos repos — ¿por qué?

| | Server | Client |
|---|--------|--------|
| Entorno | Server Component (RSC) | Browser |
| Transport | `fetch` nativo con `server-only` | Axios con interceptores |
| Repo interface | `JobServerRepository` (solo `list`) | `JobRepository` (CRUD completo) |
| Use cases | `GetJobsUseCase` | `Create/Complete/Schedule/Start/Cancel/Search/GetById` |
| Container | `container` (singleton server) | `clientContainer` (singleton browser) |

La separación no es arbitraria: el server solo hace listados iniciales (SSR), el cliente hace las mutaciones. Mezclarlos metería código server en el bundle del browser.

---

## Estructura de carpetas

```
frontend/
├── app/jobs/
│   ├── page.tsx              ← Server Component (entrada)
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
│
├── core/
│   ├── domain/                ← sin dependencias
│   │   ├── entities/
│   │   └── repositories/      ← interfaces
│   │
│   ├── application/           ← depende solo de domain
│   │   ├── schemas/           ← Zod
│   │   └── use-cases/
│   │       └── jobs/          ← agrupado por agregado
│   │
│   ├── infrastructure/
│   │   ├── repositories/      ← impls
│   │   ├── services/          ← Axios, fetch
│   │   └── container/         ← composition root
│   │
│   └── shared/                ← utils, enums, types
│
├── presentation/views/jobs/
│   ├── components/organisms/  ← thin shells
│   ├── features/              ← verb slices
│   │   ├── create-job/
│   │   ├── complete-job/
│   │   ├── schedule-job/
│   │   └── filter-jobs/
│   └── hooks/                 ← orchestration
│
├── store/                     ← Zustand UI state
└── components/                ← design system (atoms/molecules)
```
