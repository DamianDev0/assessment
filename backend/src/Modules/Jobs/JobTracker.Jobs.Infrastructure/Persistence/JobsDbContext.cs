using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Entities;
using JobTracker.Jobs.Infrastructure.Interceptors;
using JobTracker.Shared.Infrastructure.Outbox;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Jobs.Infrastructure.Persistence;

public sealed class JobsDbContext(
    DbContextOptions<JobsDbContext> options,
    InsertOutboxMessagesInterceptor outboxInterceptor
) : DbContext(options)
{
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<JobPhoto> JobPhotos => Set<JobPhoto>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.AddInterceptors(outboxInterceptor);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("jobs");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(JobsDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
