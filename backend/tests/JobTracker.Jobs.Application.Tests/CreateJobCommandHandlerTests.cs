using FluentAssertions;
using JobTracker.Jobs.Application.Abstractions;
using JobTracker.Jobs.Application.Jobs.Commands.CreateJob;
using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Repositories;
using Moq;
using Xunit;

namespace JobTracker.Jobs.Application.Tests;

public sealed class CreateJobCommandHandlerTests
{
    private readonly Mock<IJobRepository> _repositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private CreateJobCommandHandler CreateHandler() =>
        new(_repositoryMock.Object, _unitOfWorkMock.Object);

    private static CreateJobCommand ValidCommand() => new(
        Title: "Fix Roof",
        Description: "Repair damaged shingles",
        Street: "123 Main St",
        City: "Miami",
        State: "FL",
        ZipCode: "33101",
        Latitude: 25.77,
        Longitude: -80.19,
        CustomerId: Guid.NewGuid(),
        OrganizationId: Guid.NewGuid(),
        AssigneeId: null
    );

    [Fact]
    public async Task Handle_WithValidCommand_ReturnsSuccessWithJobId()
    {
        var handler = CreateHandler();

        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_WithValidCommand_PersistsJobToRepository()
    {
        var handler = CreateHandler();

        await handler.Handle(ValidCommand(), CancellationToken.None);

        _repositoryMock.Verify(
            r => r.AddAsync(It.IsAny<Job>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCommand_CommitsUnitOfWork()
    {
        var handler = CreateHandler();

        await handler.Handle(ValidCommand(), CancellationToken.None);

        _unitOfWorkMock.Verify(
            u => u.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithInvalidAddress_ReturnsFailure()
    {
        var handler = CreateHandler();
        var command = ValidCommand() with { Street = "" };

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        _repositoryMock.Verify(
            r => r.AddAsync(It.IsAny<Job>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WithEmptyTitle_ReturnsFailure()
    {
        var handler = CreateHandler();
        var command = ValidCommand() with { Title = "" };

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithValidCommand_CreatedJobHasDomainEvent()
    {
        Job? capturedJob = null;
        _repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Job>(), It.IsAny<CancellationToken>()))
            .Callback<Job, CancellationToken>((job, _) => capturedJob = job)
            .Returns(Task.CompletedTask);

        var handler = CreateHandler();
        await handler.Handle(ValidCommand(), CancellationToken.None);

        capturedJob.Should().NotBeNull();
        capturedJob!.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<Domain.Events.JobCreatedDomainEvent>();
    }
}
