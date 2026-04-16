using FluentAssertions;
using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Events;
using JobTracker.Jobs.Domain.ValueObjects;
using Xunit;

namespace JobTracker.Jobs.Domain.Tests;

public sealed class JobAggregateTests
{
    private static Address ValidAddress() =>
        Address.Create("123 Main St", "Miami", "FL", "33101", 25.77, -80.19).Value;

    private static Job CreateDraftJob() =>
        Job.Create("Fix Roof", "Repair shingles", ValidAddress(), Guid.NewGuid(), Guid.NewGuid()).Value;

    private static Job CreateScheduledJob()
    {
        var job = CreateDraftJob();
        job.Schedule(DateTime.UtcNow.AddDays(1), Guid.NewGuid());
        return job;
    }

    private static Job CreateInProgressJob()
    {
        var job = CreateScheduledJob();
        job.Start();
        return job;
    }

    [Fact]
    public void Create_WithValidData_ReturnsSuccess()
    {
        var result = Job.Create("Fix Roof", "Desc", ValidAddress(), Guid.NewGuid(), Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(Enums.JobStatus.Draft);
    }

    [Fact]
    public void Create_RaisesJobCreatedDomainEvent()
    {
        var result = Job.Create("Fix Roof", "Desc", ValidAddress(), Guid.NewGuid(), Guid.NewGuid());

        result.Value.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<JobCreatedDomainEvent>();
    }

    [Fact]
    public void Create_WithEmptyTitle_ReturnsFailure()
    {
        var result = Job.Create("", "Desc", ValidAddress(), Guid.NewGuid(), Guid.NewGuid());

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.TitleRequired");
    }

    [Fact]
    public void Create_WithEmptyCustomerId_ReturnsFailure()
    {
        var result = Job.Create("Fix Roof", "Desc", ValidAddress(), Guid.Empty, Guid.NewGuid());

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.CustomerIdRequired");
    }

    [Fact]
    public void Schedule_FromDraft_WithFutureDate_Succeeds()
    {
        var job = CreateDraftJob();

        var result = job.Schedule(DateTime.UtcNow.AddDays(1), Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
        job.Status.Should().Be(Enums.JobStatus.Scheduled);
    }

    [Fact]
    public void Schedule_WithPastDate_ReturnsFailure()
    {
        var job = CreateDraftJob();

        var result = job.Schedule(DateTime.UtcNow.AddDays(-1), Guid.NewGuid());

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.ScheduleDateInPast");
    }

    [Fact]
    public void Schedule_FromScheduled_ReturnsFailure()
    {
        var job = CreateScheduledJob();

        var result = job.Schedule(DateTime.UtcNow.AddDays(2), Guid.NewGuid());

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.InvalidTransition");
    }

    [Fact]
    public void Complete_FromInProgress_Succeeds()
    {
        var job = CreateInProgressJob();

        var result = job.Complete("https://signatures.example.com/sig.png");

        result.IsSuccess.Should().BeTrue();
        job.Status.Should().Be(Enums.JobStatus.Completed);
    }

    [Fact]
    public void Complete_FromInProgress_RaisesJobCompletedDomainEvent()
    {
        var job = CreateInProgressJob();
        job.ClearDomainEvents();

        job.Complete("https://signatures.example.com/sig.png");

        job.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<JobCompletedDomainEvent>();
    }

    [Fact]
    public void Complete_FromCompletedState_ReturnsFailure()
    {
        var job = CreateInProgressJob();
        job.Complete("https://sig.example.com/s.png");

        var result = job.Complete("https://sig.example.com/s2.png");

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.InvalidTransition");
    }

    [Fact]
    public void Complete_FromDraft_ReturnsFailure()
    {
        var job = CreateDraftJob();

        var result = job.Complete("https://sig.example.com/s.png");

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public void Cancel_FromDraft_Succeeds()
    {
        var job = CreateDraftJob();

        var result = job.Cancel("Customer cancelled");

        result.IsSuccess.Should().BeTrue();
        job.Status.Should().Be(Enums.JobStatus.Cancelled);
    }

    [Fact]
    public void Cancel_FromCompleted_ReturnsFailure()
    {
        var job = CreateInProgressJob();
        job.Complete("https://sig.example.com/s.png");

        var result = job.Cancel("Changed mind");

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.InvalidTransition");
    }

    [Fact]
    public void Cancel_RaisesJobCancelledDomainEvent()
    {
        var job = CreateDraftJob();
        job.ClearDomainEvents();

        job.Cancel("Customer request");

        job.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<JobCancelledDomainEvent>();
    }

    [Fact]
    public void AddPhoto_WhileInProgress_Succeeds()
    {
        var job = CreateInProgressJob();

        var result = job.AddPhoto("https://photos.example.com/p.jpg", "Before repair");

        result.IsSuccess.Should().BeTrue();
        job.Photos.Should().HaveCount(1);
    }

    [Fact]
    public void AddPhoto_WhileDraft_ReturnsFailure()
    {
        var job = CreateDraftJob();

        var result = job.AddPhoto("https://photos.example.com/p.jpg", null);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Job.PhotosOnlyForInProgressJobs");
    }
}
