using FluentValidation;
using JobTracker.Jobs.Application.Behaviors;
using JobTracker.Jobs.Application.Jobs.Commands.CreateJob;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace JobTracker.Jobs.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddJobsApplication(this IServiceCollection services)
    {
        var assembly = typeof(CreateJobCommand).Assembly;

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
