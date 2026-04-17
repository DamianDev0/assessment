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
) : IRequestHandler<SearchJobsQuery, Result<PagedResult<JobResponse>>>
{
    public async Task<Result<PagedResult<JobResponse>>> Handle(
        SearchJobsQuery query,
        CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();

        var parameters = BuildParameters(query);
        var totalCount = await connection.ExecuteScalarAsync<int>(BuildCountSql(query), parameters);
        var items = (await connection.QueryAsync<JobResponse>(BuildSql(query), parameters)).AsList();

        var page = new PagedResult<JobResponse>(items, totalCount, query.Page, query.PageSize);
        return Result.Success(page);
    }

    private static string BuildWhere(SearchJobsQuery query)
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
            where += " AND (j.title ILIKE @SearchPattern OR j.description ILIKE @SearchPattern)";

        return where;
    }

    private static string BuildCountSql(SearchJobsQuery query) =>
        $"SELECT COUNT(*) FROM jobs.jobs j {BuildWhere(query)}";

    private static string BuildSql(SearchJobsQuery query)
    {
        var where = BuildWhere(query);

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
            FROM jobs.jobs j
            LEFT JOIN jobs.job_photos p ON p.job_id = j.id
            {where}
            GROUP BY j.id
            ORDER BY {ResolveSortColumn(query.SortField)} {ResolveSortDir(query.SortDirection)}, j.id DESC
            LIMIT @PageSize OFFSET @Offset
            """;
    }

    private static DynamicParameters BuildParameters(SearchJobsQuery query)
    {
        var p = new DynamicParameters();
        p.Add("OrganizationId", query.OrganizationId);
        p.Add("PageSize", query.PageSize);
        p.Add("Offset", (query.Page - 1) * query.PageSize);

        if (query.Statuses is { Length: > 0 })
            p.Add("Statuses", query.Statuses.Select(s => s.ToString()).ToArray());

        if (query.DateFrom.HasValue)
            p.Add("DateFrom", query.DateFrom.Value);

        if (query.DateTo.HasValue)
            p.Add("DateTo", query.DateTo.Value);

        if (query.AssigneeId.HasValue)
            p.Add("AssigneeId", query.AssigneeId.Value);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            p.Add("SearchPattern", $"%{query.SearchTerm}%");

        return p;
    }

    private static readonly HashSet<string> AllowedSortColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        "title", "status", "city", "scheduled_date", "created_at", "updated_at"
    };

    private static string ResolveSortColumn(string? field) =>
        field is not null && AllowedSortColumns.Contains(field) ? $"j.{field}" : "j.created_at";

    private static string ResolveSortDir(string? dir) =>
        string.Equals(dir, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";
}
