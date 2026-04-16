using JobTracker.Jobs.Domain.Entities;
using JobTracker.Jobs.Domain.Enums;
using JobTracker.Jobs.Domain.Events;
using JobTracker.Jobs.Domain.ValueObjects;
using JobTracker.Shared.Domain;
using JobTracker.Shared.Domain.Primitives;

namespace JobTracker.Jobs.Domain.Aggregates;

public sealed class Job : AggregateRoot
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Address Address { get; private set; } = null!;
    public JobStatus Status { get; private set; }
    public DateTime? ScheduledDate { get; private set; }
    public Guid? AssigneeId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<JobPhoto> _photos = [];
    public IReadOnlyList<JobPhoto> Photos => _photos.AsReadOnly();

    private Job() { }

    public static Result<Job> Create(
        string title,
        string description,
        Address address,
        Guid customerId,
        Guid organizationId)
    {
        if (string.IsNullOrWhiteSpace(title))
            return Result.Failure<Job>(JobErrors.TitleRequired);

        if (customerId == Guid.Empty)
            return Result.Failure<Job>(JobErrors.CustomerIdRequired);

        if (organizationId == Guid.Empty)
            return Result.Failure<Job>(JobErrors.OrganizationIdRequired);

        var job = new Job
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Address = address,
            Status = JobStatus.Draft,
            CustomerId = customerId,
            OrganizationId = organizationId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        job.RaiseDomainEvent(new JobCreatedDomainEvent(
            Guid.NewGuid(), job.Id, job.Title, job.CustomerId, job.OrganizationId, DateTime.UtcNow));

        return Result.Success(job);
    }

    public Result Schedule(DateTime scheduledDate, Guid assigneeId)
    {
        if (Status != JobStatus.Draft)
            return Result.Failure(JobErrors.InvalidTransition(Status, JobStatus.Scheduled));

        if (scheduledDate <= DateTime.UtcNow)
            return Result.Failure(JobErrors.ScheduleDateInPast);

        if (assigneeId == Guid.Empty)
            return Result.Failure(JobErrors.AssigneeIdRequired);

        Status = JobStatus.Scheduled;
        ScheduledDate = scheduledDate;
        AssigneeId = assigneeId;
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }

    public Result Start()
    {
        if (Status != JobStatus.Scheduled)
            return Result.Failure(JobErrors.InvalidTransition(Status, JobStatus.InProgress));

        Status = JobStatus.InProgress;
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }

    public Result Complete(string signatureUrl)
    {
        if (Status != JobStatus.InProgress)
            return Result.Failure(JobErrors.InvalidTransition(Status, JobStatus.Completed));

        if (string.IsNullOrWhiteSpace(signatureUrl))
            return Result.Failure(JobErrors.SignatureUrlRequired);

        Status = JobStatus.Completed;
        UpdatedAt = DateTime.UtcNow;

        RaiseDomainEvent(new JobCompletedDomainEvent(
            Guid.NewGuid(), Id, OrganizationId, CustomerId, AssigneeId,
            signatureUrl, DateTime.UtcNow, DateTime.UtcNow));

        return Result.Success();
    }

    public Result Cancel(string reason)
    {
        if (Status is JobStatus.Completed or JobStatus.Cancelled)
            return Result.Failure(JobErrors.InvalidTransition(Status, JobStatus.Cancelled));

        if (string.IsNullOrWhiteSpace(reason))
            return Result.Failure(JobErrors.CancellationReasonRequired);

        Status = JobStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;

        RaiseDomainEvent(new JobCancelledDomainEvent(
            Guid.NewGuid(), Id, OrganizationId, reason, DateTime.UtcNow, DateTime.UtcNow));

        return Result.Success();
    }

    public Result AddPhoto(string url, string? caption)
    {
        if (Status != JobStatus.InProgress)
            return Result.Failure(JobErrors.PhotosOnlyForInProgressJobs);

        if (string.IsNullOrWhiteSpace(url))
            return Result.Failure(JobErrors.PhotoUrlRequired);

        _photos.Add(JobPhoto.Create(Id, url, caption));
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }
}

public static class JobErrors
{
    public static readonly Error TitleRequired = new("Job.TitleRequired", "Job title is required.");
    public static readonly Error CustomerIdRequired = new("Job.CustomerIdRequired", "Customer ID is required.");
    public static readonly Error OrganizationIdRequired = new("Job.OrganizationIdRequired", "Organization ID is required.");
    public static readonly Error ScheduleDateInPast = new("Job.ScheduleDateInPast", "Scheduled date cannot be in the past.");
    public static readonly Error AssigneeIdRequired = new("Job.AssigneeIdRequired", "Assignee ID is required when scheduling.");
    public static readonly Error SignatureUrlRequired = new("Job.SignatureUrlRequired", "Signature URL is required to complete a job.");
    public static readonly Error CancellationReasonRequired = new("Job.CancellationReasonRequired", "A reason is required to cancel a job.");
    public static readonly Error PhotoUrlRequired = new("Job.PhotoUrlRequired", "Photo URL is required.");
    public static readonly Error PhotosOnlyForInProgressJobs = new("Job.PhotosOnlyForInProgressJobs", "Photos can only be added to in-progress jobs.");

    public static Error InvalidTransition(JobStatus from, JobStatus to) =>
        new("Job.InvalidTransition", $"Cannot transition from '{from}' to '{to}'.");
}
