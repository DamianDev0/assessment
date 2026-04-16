using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.CancelJob;

public sealed record CancelJobCommand(
    Guid JobId,
    string Reason,
    Guid OrganizationId
) : IRequest<Result>;
