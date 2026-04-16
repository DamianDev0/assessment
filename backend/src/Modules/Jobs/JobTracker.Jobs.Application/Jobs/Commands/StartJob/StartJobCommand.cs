using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.StartJob;

public sealed record StartJobCommand(
    Guid JobId,
    Guid OrganizationId
) : IRequest<Result>;
