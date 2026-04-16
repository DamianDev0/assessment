using FluentAssertions;
using JobTracker.Jobs.Application.Abstractions;
using JobTracker.Jobs.Application.Jobs.Commands.CompleteJob;
using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Events;
using JobTracker.Jobs.Domain.Repositories;
using JobTracker.Jobs.Domain.ValueObjects;
using Moq;
using Xunit;

namespace JobTracker.Jobs.Application.Tests;

public sealed class CompleteJobCommandHandlerTests
{
    private readonly Mock<IJobRepository> _repositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private CompleteJobCommandHandler CreateHandler() =>
        new(_repositoryMock.Object, _unitOfWorkMock.Object);

    private static Job CreateInProgressJob(Guid? id = null, Guid? orgId = null)
    {
        var address = Address.Create("123 Main St", "Miami", "FL", "33101", 25.77, -80.19).Value;
        var job = Job.Create("Fix Roof", "Repair shingles", address, Guid.NewGuid(), orgId ?? Guid.NewGuid()).Value;
        job.Schedule(DateTime.UtcNow.AddDays(1), Guid.NewGuid());
        job.Start();
        job.ClearDomainEvents(); // clear events from Create/Schedule/Start
        return job;
    }

    [Fact]
    public async Task Handle_WithValidCommand_ReturnsSuccess()
    {
        var orgId = Guid.NewGuid();
        var job = CreateInProgressJob(orgId: orgId);
        _repositoryMock
            .Setup(r => r.GetByIdAndOrganizationAsync(job.Id, orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = CreateHandler();
        var command = new CompleteJobCommand(job.Id, "https://sig.example.com/s.png", orgId);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        job.Status.Should().Be(Domain.Enums.JobStatus.Completed);
    }

    [Fact]
    public async Task Handle_WithValidCommand_CommitsUnitOfWork()
    {
        var orgId = Guid.NewGuid();
        var job = CreateInProgressJob(orgId: orgId);
        _repositoryMock
            .Setup(r => r.GetByIdAndOrganizationAsync(job.Id, orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = CreateHandler();
        var command = new CompleteJobCommand(job.Id, "https://sig.example.com/s.png", orgId);

        await handler.Handle(command, CancellationToken.None);

        _unitOfWorkMock.Verify(
            u => u.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidCommand_RaisesJobCompletedDomainEvent()
    {
        var orgId = Guid.NewGuid();
        var job = CreateInProgressJob(orgId: orgId);
        _repositoryMock
            .Setup(r => r.GetByIdAndOrganizationAsync(job.Id, orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = CreateHandler();
        var command = new CompleteJobCommand(job.Id, "https://sig.example.com/s.png", orgId);

        await handler.Handle(command, CancellationToken.None);

        job.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<JobCompletedDomainEvent>();
    }

    [Fact]
    public async Task Handle_JobNotFound_ReturnsFailure()
    {
        var orgId = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.GetByIdAndOrganizationAsync(It.IsAny<Guid>(), orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Job?)null);

        var handler = CreateHandler();
        var command = new CompleteJobCommand(Guid.NewGuid(), "https://sig.example.com/s.png", orgId);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.NotFound");
    }

    [Fact]
    public async Task Handle_JobNotInProgress_ReturnsFailure()
    {
        var orgId = Guid.NewGuid();
        var address = Address.Create("123 Main St", "Miami", "FL", "33101", 25.77, -80.19).Value;
        var draftJob = Job.Create("Fix Roof", "Desc", address, Guid.NewGuid(), orgId).Value;

        _repositoryMock
            .Setup(r => r.GetByIdAndOrganizationAsync(draftJob.Id, orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(draftJob);

        var handler = CreateHandler();
        var command = new CompleteJobCommand(draftJob.Id, "https://sig.example.com/s.png", orgId);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.InvalidTransition");
    }

    [Fact]
    public async Task Handle_JobNotFound_DoesNotCallSaveChanges()
    {
        _repositoryMock
            .Setup(r => r.GetByIdAndOrganizationAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Job?)null);

        var handler = CreateHandler();
        var command = new CompleteJobCommand(Guid.NewGuid(), "https://sig.example.com/s.png", Guid.NewGuid());

        await handler.Handle(command, CancellationToken.None);

        _unitOfWorkMock.Verify(
            u => u.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
