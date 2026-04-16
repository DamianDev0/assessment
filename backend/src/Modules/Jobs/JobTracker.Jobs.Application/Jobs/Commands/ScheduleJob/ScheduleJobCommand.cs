using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.ScheduleJob;

public sealed record ScheduleJobCommand(
    Guid JobId,
    DateTime ScheduledDate,
    Guid AssigneeId,
    Guid OrganizationId
) : IRequest<Result>;
