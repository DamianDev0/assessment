namespace JobTracker.Jobs.Api.Contracts;

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int TotalPages,
    int CurrentPage,
    int PageSize);
