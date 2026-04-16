using JobTracker.Jobs.Application.Abstractions;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.ScheduleJob;

internal sealed class ScheduleJobCommandHandler(
    IJobRepository jobRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ScheduleJobCommand, Result>
{
    public async Task<Result> Handle(ScheduleJobCommand command, CancellationToken cancellationToken)
    {
        var job = await jobRepository.GetByIdAndOrganizationAsync(
            command.JobId, command.OrganizationId, cancellationToken);

        if (job is null)
            return Result.Failure(new Error("Job.NotFound", $"Job '{command.JobId}' was not found."));

        var result = job.Schedule(command.ScheduledDate, command.AssigneeId);
        if (result.IsFailure)
            return result;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
