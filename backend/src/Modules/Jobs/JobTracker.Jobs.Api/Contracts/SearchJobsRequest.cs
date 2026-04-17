using JobTracker.Jobs.Application.Jobs.Queries.SearchJobs;
using JobTracker.Jobs.Domain.Enums;

namespace JobTracker.Jobs.Api.Contracts;

public sealed record SearchJobsRequest(
    string[]? Statuses,
    DateTime? DateFrom,
    DateTime? DateTo,
    Guid? AssigneeId,
    string? SearchTerm,
    int Page = 1,
    int PageSize = 20,
    string? SortField = null,
    string? SortDirection = null)
{
    public SearchJobsQuery ToQuery(Guid organizationId)
    {
        JobStatus[]? parsedStatuses = null;

        if (Statuses is { Length: > 0 })
        {
            var valid = new List<JobStatus>(Statuses.Length);
            foreach (var s in Statuses)
            {
                if (Enum.TryParse<JobStatus>(s, ignoreCase: true, out var status))
                    valid.Add(status);
                else
                    throw new ArgumentException($"Invalid job status: '{s}'. Valid values: {string.Join(", ", Enum.GetNames<JobStatus>())}");
            }
            parsedStatuses = valid.ToArray();
        }

        return new SearchJobsQuery(
            organizationId, parsedStatuses, DateFrom, DateTo,
            AssigneeId, SearchTerm, Page, PageSize, SortField, SortDirection);
    }
}
