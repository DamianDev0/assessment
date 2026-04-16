using JobTracker.Jobs.Application.Abstractions;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Shared.Domain.Primitives;
using MediatR;

namespace JobTracker.Jobs.Application.Jobs.Commands.StartJob;

internal sealed class StartJobCommandHandler(
    IJobRepository jobRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<StartJobCommand, Result>
{
    public async Task<Result> Handle(StartJobCommand command, CancellationToken cancellationToken)
    {
        var job = await jobRepository.GetByIdAndOrganizationAsync(
            command.JobId, command.OrganizationId, cancellationToken);

        if (job is null)
            return Result.Failure(new Error("Job.NotFound", $"Job '{command.JobId}' was not found."));

        var result = job.Start();
        if (result.IsFailure)
            return result;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
