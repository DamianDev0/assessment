namespace JobTracker.Jobs.Api.Contracts;

public sealed record CursorPageResponse<T>(
    IReadOnlyList<T> Items,
    Guid? NextCursor,
    bool HasMore);
