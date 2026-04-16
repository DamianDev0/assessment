namespace JobTracker.Jobs.Application.Jobs.Queries.SearchJobs;

/// <summary>
/// Read-side projection hydrated by Dapper. Uses init-only setters instead of
/// a positional record because Dapper requires a parameterless ctor to handle
/// nullable columns (scheduled_date, assignee_id) and the bigint photo_count
/// coming from COUNT(p.id).
/// </summary>
public sealed class JobResponse
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Street { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public string ZipCode { get; init; } = string.Empty;
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public DateTime? ScheduledDate { get; init; }
    public Guid? AssigneeId { get; init; }
    public Guid CustomerId { get; init; }
    public Guid OrganizationId { get; init; }
    public long PhotoCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
