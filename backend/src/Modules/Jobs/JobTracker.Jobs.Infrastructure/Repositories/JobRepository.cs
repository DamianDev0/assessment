using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Jobs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Jobs.Infrastructure.Repositories;

internal sealed partial class JobRepository(JobsDbContext context) : IJobRepository
{
    public async Task<Job?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await context.Jobs
            .Include(j => j.Photos)
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);

    public async Task<Job?> GetByIdAndOrganizationAsync(
        Guid id,
        Guid organizationId,
        CancellationToken cancellationToken = default) =>
        await context.Jobs
            .Include(j => j.Photos)
            .FirstOrDefaultAsync(j => j.Id == id && j.OrganizationId == organizationId, cancellationToken);

    public async Task AddAsync(Job job, CancellationToken cancellationToken = default) =>
        await context.Jobs.AddAsync(job, cancellationToken);
}
