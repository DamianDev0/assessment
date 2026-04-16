using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.CompleteJob;

public sealed record CompleteJobCommand(
    Guid JobId,
    string SignatureUrl,
    Guid OrganizationId
) : IRequest<Result>;
