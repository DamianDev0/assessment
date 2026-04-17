using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Enums;

namespace JobTracker.Jobs.Domain.Repositories;

public interface IJobRepository
{
    Task<Job?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Job?> GetByIdAndOrganizationAsync(Guid id, Guid organizationId, CancellationToken cancellationToken = default);
    Task AddAsync(Job job, CancellationToken cancellationToken = default);
    Task<PagedResult<Job>> SearchAsync(JobSearchCriteria criteria, CancellationToken cancellationToken = default);
}

public sealed record JobSearchCriteria(
    Guid OrganizationId,
    JobStatus[]? Statuses = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    Guid? AssigneeId = null,
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 20
);

public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int TotalCount { get; }
    public int TotalPages { get; }
    public int CurrentPage { get; }
    public int PageSize { get; }

    public PagedResult(IReadOnlyList<T> items, int totalCount, int currentPage, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        CurrentPage = currentPage;
        PageSize = pageSize;
        TotalPages = pageSize > 0 ? (int)Math.Ceiling(totalCount / (double)pageSize) : 0;
    }
}
