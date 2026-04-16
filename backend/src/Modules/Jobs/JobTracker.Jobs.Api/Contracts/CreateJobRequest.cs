using JobTracker.Jobs.Application.Jobs.Commands.CreateJob;

namespace JobTracker.Jobs.Api.Contracts;

public sealed record CreateJobRequest(
    string Title,
    string Description,
    string Street,
    string City,
    string State,
    string ZipCode,
    double Latitude,
    double Longitude,
    Guid CustomerId,
    Guid? AssigneeId)
{
    public CreateJobCommand ToCommand(Guid organizationId) => new(
        Title, Description, Street, City, State, ZipCode,
        Latitude, Longitude, CustomerId, organizationId, AssigneeId);
}
