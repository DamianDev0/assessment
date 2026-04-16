using JobTracker.Jobs.Application.Abstractions;

namespace JobTracker.Jobs.Infrastructure.Persistence;

internal sealed class UnitOfWork(JobsDbContext context) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
