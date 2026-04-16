using JobTracker.Jobs.Application.Abstractions;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Shared.Domain.Primitives;
using Dapper;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Queries.SearchJobs;

/// <summary>
/// Read-optimized query handler using Dapper (raw SQL).
/// In CQRS, the read path bypasses the domain model and repository entirely —
/// it queries the database directly and projects into flat DTOs.
/// This avoids EF Core change tracking overhead and allows us to write
/// optimized SQL with cursor-based pagination and full-text search.
/// </summary>
internal sealed class SearchJobsQueryHandler(
    IDbConnectionFactory connectionFactory
) : IRequestHandler<SearchJobsQuery, Result<CursorPage<JobResponse>>>
{
    public async Task<Result<CursorPage<JobResponse>>> Handle(
        SearchJobsQuery query,
        CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();

        // Build dynamic SQL based on provided filters
        var sql = BuildSql(query);
        var parameters = BuildParameters(query);

        var items = (await connection.QueryAsync<JobResponse>(sql, parameters))
            .AsList();

        // Cursor pagination: we fetch limit + 1 to detect if there's a next page
        Guid? nextCursor = null;
        if (items.Count > query.Limit)
        {
            items.RemoveAt(items.Count - 1);
            nextCursor = items[^1].Id;
        }

        var page = new CursorPage<JobResponse>(items, nextCursor);
        return Result.Success(page);
    }

    private static string BuildSql(SearchJobsQuery query)
    {
        var where = "WHERE j.organization_id = @OrganizationId";

        if (query.Statuses is { Length: > 0 })
            where += " AND j.status = ANY(@Statuses)";

        if (query.DateFrom.HasValue)
            where += " AND j.scheduled_date >= @DateFrom";

        if (query.DateTo.HasValue)
            where += " AND j.scheduled_date <= @DateTo";

        if (query.AssigneeId.HasValue)
            where += " AND j.assignee_id = @AssigneeId";

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            where += @" AND to_tsvector('english', j.title || ' ' || j.description)
                        @@ plainto_tsquery('english', @SearchTerm)";

        if (query.Cursor.HasValue)
            where += @" AND (j.created_at < (SELECT created_at FROM jobs.jobs WHERE id = @Cursor)
                        OR (j.created_at = (SELECT created_at FROM jobs.jobs WHERE id = @Cursor)
                            AND j.id < @Cursor))";

        var rankSelect = !string.IsNullOrWhiteSpace(query.SearchTerm)
            ? @", ts_rank(
                    to_tsvector('english', j.title || ' ' || j.description),
                    plainto_tsquery('english', @SearchTerm)
                ) AS rank"
            : "";

        return $"""
            SELECT
                j.id             AS {nameof(JobResponse.Id)},
                j.title          AS {nameof(JobResponse.Title)},
                j.description    AS {nameof(JobResponse.Description)},
                j.status         AS {nameof(JobResponse.Status)},
                j.street         AS {nameof(JobResponse.Street)},
                j.city           AS {nameof(JobResponse.City)},
                j.state          AS {nameof(JobResponse.State)},
                j.zip_code       AS {nameof(JobResponse.ZipCode)},
                j.latitude       AS {nameof(JobResponse.Latitude)},
                j.longitude      AS {nameof(JobResponse.Longitude)},
                j.scheduled_date AS {nameof(JobResponse.ScheduledDate)},
                j.assignee_id    AS {nameof(JobResponse.AssigneeId)},
                j.customer_id    AS {nameof(JobResponse.CustomerId)},
                j.organization_id AS {nameof(JobResponse.OrganizationId)},
                COUNT(p.id)      AS {nameof(JobResponse.PhotoCount)},
                j.created_at     AS {nameof(JobResponse.CreatedAt)},
                j.updated_at     AS {nameof(JobResponse.UpdatedAt)}
                {rankSelect}
            FROM jobs.jobs j
            LEFT JOIN jobs.job_photos p ON p.job_id = j.id
            {where}
            GROUP BY j.id
            ORDER BY j.created_at DESC, j.id DESC
            LIMIT @Limit
            """;
    }

    private static DynamicParameters BuildParameters(SearchJobsQuery query)
    {
        var p = new DynamicParameters();
        p.Add("OrganizationId", query.OrganizationId);
        p.Add("Limit", query.Limit + 1); // +1 for next-page detection

        if (query.Statuses is { Length: > 0 })
            p.Add("Statuses", query.Statuses.Select(s => s.ToString()).ToArray());

        if (query.DateFrom.HasValue)
            p.Add("DateFrom", query.DateFrom.Value);

        if (query.DateTo.HasValue)
            p.Add("DateTo", query.DateTo.Value);

        if (query.AssigneeId.HasValue)
            p.Add("AssigneeId", query.AssigneeId.Value);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            p.Add("SearchTerm", query.SearchTerm);

        if (query.Cursor.HasValue)
            p.Add("Cursor", query.Cursor.Value);

        return p;
    }
}
