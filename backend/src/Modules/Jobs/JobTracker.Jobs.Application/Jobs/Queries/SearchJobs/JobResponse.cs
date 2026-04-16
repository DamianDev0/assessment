namespace JobTracker.Jobs.Application.Jobs.Queries.SearchJobs;

public sealed record JobResponse(
    Guid Id,
    string Title,
    string Description,
    string Status,
    string Street,
    string City,
    string State,
    string ZipCode,
    double Latitude,
    double Longitude,
    DateTime? ScheduledDate,
    Guid? AssigneeId,
    Guid CustomerId,
    Guid OrganizationId,
    int PhotoCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
