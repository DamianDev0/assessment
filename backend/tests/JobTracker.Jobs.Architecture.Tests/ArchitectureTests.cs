using FluentAssertions;
using NetArchTest.Rules;
using System.Reflection;
using Xunit;

namespace JobTracker.Jobs.Architecture.Tests;

public sealed class ArchitectureTests
{
    private static readonly Assembly DomainAssembly =
        typeof(Domain.Aggregates.Job).Assembly;

    private static readonly Assembly ApplicationAssembly =
        typeof(Application.Jobs.Commands.CreateJob.CreateJobCommand).Assembly;

    private static readonly Assembly InfrastructureAssembly =
        typeof(Infrastructure.Persistence.JobsDbContext).Assembly;

    [Fact]
    public void Domain_ShouldNot_ReferenceEntityFramework()
    {
        var result = Types.InAssembly(DomainAssembly)
            .Should().NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            $"Violating types: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }

    [Fact]
    public void Domain_ShouldNot_ReferenceHangfire()
    {
        var result = Types.InAssembly(DomainAssembly)
            .Should().NotHaveDependencyOn("Hangfire")
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Application_ShouldNot_ReferenceEntityFramework()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .Should().NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void CommandHandlers_Should_BeSealed()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .That().HaveNameEndingWith("CommandHandler")
            .Should().BeSealed()
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            $"Violating: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }

    [Fact]
    public void QueryHandlers_Should_BeSealed()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .That().HaveNameEndingWith("QueryHandler")
            .Should().BeSealed()
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Validators_Should_BeInternal()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .That().HaveNameEndingWith("Validator")
            .Should().NotBePublic()
            .GetResult();

        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void DomainEntities_ShouldNot_HavePublicSetters()
    {
        var publicSetters = typeof(Domain.Aggregates.Job)
            .GetProperties()
            .Where(p => p.GetSetMethod()?.IsPublic == true)
            .Select(p => p.Name)
            .ToList();

        publicSetters.Should().BeEmpty(
            $"Public setters found: {string.Join(", ", publicSetters)}");
    }
}
