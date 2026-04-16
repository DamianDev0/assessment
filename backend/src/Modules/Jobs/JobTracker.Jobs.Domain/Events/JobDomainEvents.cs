using JobTracker.Shared.Domain;

namespace JobTracker.Jobs.Domain.Events;

public sealed record JobCreatedDomainEvent(
    Guid Id, Guid JobId, string Title, Guid CustomerId,
    Guid OrganizationId, DateTime OccurredOn
) : IDomainEvent;

public sealed record JobCompletedDomainEvent(
    Guid Id, Guid JobId, Guid OrganizationId, Guid CustomerId,
    Guid? AssigneeId, string SignatureUrl, DateTime CompletedAt,
    DateTime OccurredOn
) : IDomainEvent;

public sealed record JobCancelledDomainEvent(
    Guid Id, Guid JobId, Guid OrganizationId, string Reason,
    DateTime CancelledAt, DateTime OccurredOn
) : IDomainEvent;
