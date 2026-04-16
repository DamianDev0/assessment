using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.CreateJob;

public sealed record CreateJobCommand(
    string Title,
    string Description,
    string Street,
    string City,
    string State,
    string ZipCode,
    double Latitude,
    double Longitude,
    Guid CustomerId,
    Guid OrganizationId,
    Guid? AssigneeId
) : IRequest<Result<Guid>>;
