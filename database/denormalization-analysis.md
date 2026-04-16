# Denormalization vs Integration Events — Analysis

## When to Denormalize the Customer Name

Denormalizing the customer name (e.g., adding `customer_name TEXT` to `jobs.jobs`) is justified when:

- **Read-heavy workloads dominate**: The jobs list page is the most accessed view. Every render requires the customer name alongside job data. A cross-module JOIN to a `contacts.customers` table violates bounded context isolation and adds latency proportional to the number of displayed jobs.
- **The denormalized field changes infrequently**: Customer names rarely change. When they do, eventual consistency (updating within seconds via an integration event) is acceptable — no user expects a name change to propagate instantly to every historical job.
- **The query crosses bounded contexts**: In a modular monolith, the Jobs module should not reference the Contacts module's tables directly. Denormalization avoids this coupling entirely.

**Trade-off**: The `customer_name` in `jobs.jobs` may become stale until the next `CustomerNameUpdatedIntegrationEvent` is processed. For a job management system, this staleness window (seconds to minutes) is acceptable.

## When to Use Integration Events Instead

Integration events are preferred when:

- **The data changes frequently** and staleness is unacceptable (e.g., customer credit status, real-time inventory).
- **Multiple modules need the same data** — denormalizing into every consumer table creates N copies to maintain.
- **The data is complex** (not a single field) and denormalizing would duplicate entire structures.

In our system, `JobCompletedIntegrationEvent` notifies the Billing module to generate an invoice. The Billing module queries its own tables for pricing — we would never denormalize invoice data into the Jobs table.

## Consistency Trade-offs

| Approach | Consistency | Performance | Coupling |
|---|---|---|---|
| JOIN across modules | Strong (always current) | Slower (cross-schema join) | High (schema dependency) |
| Denormalization | Eventual (stale window) | Faster (no join) | Low (owns its data) |
| Integration events | Eventual (async delivery) | Independent | Lowest (contract-only) |

The recommended approach for JobTracker: **denormalize `customer_name`** into the jobs table, kept in sync via `CustomerNameUpdatedIntegrationEvent` from the Contacts module. This gives O(1) reads with minimal staleness and zero cross-module coupling.
