using JobTracker.Jobs.Application.Abstractions;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Jobs.Infrastructure.Interceptors;
using JobTracker.Jobs.Infrastructure.Persistence;
using JobTracker.Jobs.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace JobTracker.Jobs.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddJobsInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddSingleton<InsertOutboxMessagesInterceptor>();

        services.AddDbContext<JobsDbContext>((sp, opts) =>
            opts.UseNpgsql(connectionString)
                .UseSnakeCaseNamingConvention()
                .AddInterceptors(sp.GetRequiredService<InsertOutboxMessagesInterceptor>()));

        services.AddScoped<IJobRepository, JobRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Dapper connection factory for read-optimized queries (CQRS read path)
        services.AddSingleton<IDbConnectionFactory>(_ => new DbConnectionFactory(connectionString));

        return services;
    }
}
