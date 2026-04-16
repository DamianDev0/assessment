-- ============================================================================
-- JobTracker — Jobs Module Schema
-- PostgreSQL 16+
-- ============================================================================
-- This file contains the complete DDL for the Jobs bounded context.
-- EF Core migrations generate the same schema automatically, but this file
-- serves as the authoritative, human-readable reference.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Schema isolation — each module owns its own schema
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS jobs;

-- ----------------------------------------------------------------------------
-- 2. Jobs table (Aggregate Root)
-- ----------------------------------------------------------------------------
-- The `jobs` table maps 1:1 to the Job aggregate.
-- The Address value object is stored as OWNED columns (no separate table)
-- to avoid unnecessary joins for every job read.
-- JobStatus is stored as TEXT (not integer) for readability in queries and logs.
-- ----------------------------------------------------------------------------
CREATE TABLE jobs.jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'Draft',
    -- Address (owned value object — flattened into the jobs table)
    -- Rationale: Address is always read with the Job. Separate table would add
    -- a mandatory JOIN on every query for zero benefit, since Address has no
    -- independent identity or lifecycle.
    street          TEXT NOT NULL,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    zip_code        TEXT NOT NULL,
    latitude        DOUBLE PRECISION NOT NULL DEFAULT 0,
    longitude       DOUBLE PRECISION NOT NULL DEFAULT 0,
    -- Scheduling & assignment
    scheduled_date  TIMESTAMPTZ,
    assignee_id     UUID,
    -- Relations
    customer_id     UUID NOT NULL,
    organization_id UUID NOT NULL,   -- tenant isolation column
    -- Audit
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Optimistic concurrency (PostgreSQL xmin system column used by EF Core)
    xmin            xid,             -- EF Core uses this as row version
    -- Domain constraint: status must be one of the valid enum values
    CONSTRAINT jobs_status_check CHECK (
        status IN ('Draft', 'Scheduled', 'InProgress', 'Completed', 'Cancelled')
    )
);

-- ----------------------------------------------------------------------------
-- 3. Job Photos table (Entity owned by Job aggregate)
-- ----------------------------------------------------------------------------
-- Photos can only be added via Job.AddPhoto() — the aggregate root controls
-- access. CASCADE delete ensures no orphan photos when a job is removed.
-- ----------------------------------------------------------------------------
CREATE TABLE jobs.job_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID NOT NULL REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    caption     TEXT
);

-- ----------------------------------------------------------------------------
-- 4. Outbox Messages table (Transactional Outbox Pattern)
-- ----------------------------------------------------------------------------
-- Domain events are serialized to this table in the SAME transaction as the
-- aggregate mutation. A Hangfire recurring job polls unprocessed messages
-- and publishes them via MediatR. This guarantees at-least-once delivery:
-- if the process crashes after SaveChanges but before publishing, the message
-- remains in the outbox and will be retried on the next poll cycle.
-- ----------------------------------------------------------------------------
CREATE TABLE jobs.outbox_messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type         TEXT NOT NULL,              -- AssemblyQualifiedName of the event
    content      JSONB NOT NULL,             -- serialized event payload
    occurred_on  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_on TIMESTAMPTZ                 -- NULL = not yet processed
);

-- ============================================================================
-- 5. Indexes
-- ============================================================================

-- 5.1 Multi-tenant queries
-- Every query filters by organization_id first. This index supports tenant
-- isolation and prevents full table scans in a multi-tenant environment.
CREATE INDEX idx_jobs_org_id
    ON jobs.jobs(organization_id);

-- 5.2 Status-based filtering within a tenant
-- The most common query is "show me all scheduled/in-progress jobs for my org".
-- Composite index on (org, status) avoids scanning all jobs for the tenant.
CREATE INDEX idx_jobs_org_status
    ON jobs.jobs(organization_id, status);

-- 5.3 Date range queries within a tenant
-- Scheduling views filter by date range. Composite index supports range scans
-- efficiently: WHERE organization_id = :org AND scheduled_date BETWEEN :from AND :to
CREATE INDEX idx_jobs_org_date
    ON jobs.jobs(organization_id, scheduled_date);

-- 5.4 Assignee filtering within a tenant
-- "Show me all jobs assigned to technician X"
CREATE INDEX idx_jobs_org_assignee
    ON jobs.jobs(organization_id, assignee_id);

-- 5.5 Full-text search (GIN index)
-- Supports efficient text search on title + description using PostgreSQL's
-- built-in tsvector/tsquery. GIN (Generalized Inverted Index) is optimized
-- for containment queries — it indexes every lexeme, so @@ searches are O(1)
-- per lexeme instead of scanning every row.
CREATE INDEX idx_jobs_fts
    ON jobs.jobs
    USING GIN (to_tsvector('english', title || ' ' || description));

-- 5.6 Outbox: unprocessed messages
-- Partial index — only indexes rows where processed_on IS NULL.
-- The ProcessOutboxMessagesJob queries only unprocessed messages, so this
-- index stays small and fast even as processed messages accumulate.
CREATE INDEX idx_outbox_unprocessed
    ON jobs.outbox_messages(occurred_on)
    WHERE processed_on IS NULL;
