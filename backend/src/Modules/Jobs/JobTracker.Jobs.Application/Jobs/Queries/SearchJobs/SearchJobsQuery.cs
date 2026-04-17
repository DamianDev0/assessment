using JobTracker.Jobs.Domain.Enums;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Queries.SearchJobs;

public sealed record SearchJobsQuery(
    Guid OrganizationId,
    JobStatus[]? Statuses,
    DateTime? DateFrom,
    DateTime? DateTo,
    Guid? AssigneeId,
    string? SearchTerm,
    int Page = 1,
    int PageSize = 20,
    string? SortField = null,
    string? SortDirection = null
) : IRequest<Result<PagedResult<JobResponse>>>;
