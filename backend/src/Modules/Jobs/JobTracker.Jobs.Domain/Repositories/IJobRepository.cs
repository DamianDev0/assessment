using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Enums;

namespace JobTracker.Jobs.Domain.Repositories;

public interface IJobRepository
{
    Task<Job?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Job?> GetByIdAndOrganizationAsync(Guid id, Guid organizationId, CancellationToken cancellationToken = default);
    Task AddAsync(Job job, CancellationToken cancellationToken = default);
    Task<CursorPage<Job>> SearchAsync(JobSearchCriteria criteria, CancellationToken cancellationToken = default);
}

public sealed record JobSearchCriteria(
    Guid OrganizationId,
    JobStatus[]? Statuses = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    Guid? AssigneeId = null,
    string? SearchTerm = null,
    Guid? Cursor = null,
    int Limit = 20
);

public sealed class CursorPage<T>
{
    public IReadOnlyList<T> Items { get; }
    public Guid? NextCursor { get; }
    public bool HasMore => NextCursor.HasValue;

    public CursorPage(IReadOnlyList<T> items, Guid? nextCursor)
    {
        Items = items;
        NextCursor = nextCursor;
    }

    public CursorPage<TOut> Map<TOut>(Func<T, TOut> selector) =>
        new(Items.Select(selector).ToList(), NextCursor);
}
