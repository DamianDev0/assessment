-- ============================================================================
-- Optimized Job Search Query — Cursor-Based Pagination
-- ============================================================================
--
-- INDEXING STRATEGY
-- -----------------
-- This query is designed to leverage the following indexes:
--   1. idx_jobs_org_status    → (organization_id, status)  — tenant + status filter
--   2. idx_jobs_org_date      → (organization_id, scheduled_date) — date range
--   3. idx_jobs_fts           → GIN on tsvector(title || description) — text search
--   4. idx_outbox_unprocessed → partial index for outbox polling
--
-- The query planner will choose the most selective index based on the filters
-- provided. When multiple filters are active, PostgreSQL uses bitmap index
-- scans to combine results from multiple indexes efficiently.
--
-- WHY CURSOR-BASED PAGINATION OVER OFFSET
-- ----------------------------------------
-- OFFSET-based: `SELECT ... OFFSET 10000 LIMIT 20`
--   The database must scan and DISCARD 10,000 rows before returning 20.
--   Cost: O(N) where N = offset value. Page 500 of 20 items = scan 10,000 rows.
--
-- Cursor-based: `SELECT ... WHERE (created_at, id) < (:cursor_created_at, :cursor_id) LIMIT 20`
--   The database uses the index to jump directly to the cursor position.
--   Cost: O(log N) regardless of which "page" you're on.
--
-- Additional benefits of cursor-based:
--   - Stable results when new rows are inserted (OFFSET shifts rows between pages)
--   - Consistent performance on page 1 and page 1000
--   - Works well with real-time data where rows are constantly added
--
-- ============================================================================

SELECT
    j.id,
    j.title,
    j.description,
    j.status,
    j.street,
    j.city,
    j.state,
    j.zip_code,
    j.latitude,
    j.longitude,
    j.scheduled_date,
    j.assignee_id,
    j.customer_id,
    j.organization_id,
    j.created_at,
    j.updated_at,
    COUNT(p.id) AS photo_count,
    -- Full-text relevance ranking (only computed when search_term is provided)
    CASE
        WHEN :search_term IS NOT NULL THEN
            ts_rank(
                to_tsvector('english', j.title || ' ' || j.description),
                plainto_tsquery('english', :search_term)
            )
        ELSE 0
    END AS rank
FROM jobs.jobs j
LEFT JOIN jobs.job_photos p ON p.job_id = j.id
WHERE
    -- Tenant isolation (ALWAYS applied — uses idx_jobs_org_id or composites)
    j.organization_id = :org_id

    -- Status filter (optional, multi-value — uses idx_jobs_org_status)
    AND (:statuses IS NULL OR j.status = ANY(:statuses))

    -- Date range filter (optional — uses idx_jobs_org_date)
    AND (:date_from IS NULL OR j.scheduled_date >= :date_from)
    AND (:date_to   IS NULL OR j.scheduled_date <= :date_to)

    -- Assignee filter (optional — uses idx_jobs_org_assignee)
    AND (:assignee_id IS NULL OR j.assignee_id = :assignee_id)

    -- Full-text search (optional — uses idx_jobs_fts GIN index)
    AND (:search_term IS NULL OR
         to_tsvector('english', j.title || ' ' || j.description)
         @@ plainto_tsquery('english', :search_term))

    -- Cursor-based pagination
    -- Uses composite (created_at, id) to guarantee deterministic ordering
    -- even when multiple jobs share the same created_at timestamp.
    -- The cursor values come from the LAST item of the previous page.
    AND (
        :cursor_created_at IS NULL
        OR j.created_at < :cursor_created_at
        OR (j.created_at = :cursor_created_at AND j.id < :cursor_id)
    )
GROUP BY j.id
ORDER BY j.created_at DESC, j.id DESC
-- Fetch one extra row to determine if there are more pages.
-- If we get page_size + 1 rows, there's a next page; the extra row
-- becomes the cursor for the next request.
LIMIT :page_size + 1;
