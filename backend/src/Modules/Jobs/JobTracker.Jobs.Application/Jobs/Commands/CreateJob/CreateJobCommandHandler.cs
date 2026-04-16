using JobTracker.Jobs.Application.Abstractions;
using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Jobs.Domain.ValueObjects;
using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.CreateJob;

internal sealed class CreateJobCommandHandler(
    IJobRepository jobRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateJobCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateJobCommand command, CancellationToken cancellationToken)
    {
        var addressResult = Address.Create(
            command.Street, command.City, command.State,
            command.ZipCode, command.Latitude, command.Longitude);

        if (addressResult.IsFailure)
            return Result.Failure<Guid>(addressResult.Error);

        var jobResult = Job.Create(
            command.Title, command.Description, addressResult.Value,
            command.CustomerId, command.OrganizationId);

        if (jobResult.IsFailure)
            return Result.Failure<Guid>(jobResult.Error);

        var job = jobResult.Value;

        if (command.AssigneeId.HasValue)
        {
            var scheduleResult = job.Schedule(DateTime.UtcNow.AddHours(1), command.AssigneeId.Value);
            if (scheduleResult.IsFailure)
                return Result.Failure<Guid>(scheduleResult.Error);
        }

        await jobRepository.AddAsync(job, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(job.Id);
    }
}
