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
    Guid? Cursor,
    int Limit = 20
) : IRequest<Result<CursorPage<JobResponse>>>;
