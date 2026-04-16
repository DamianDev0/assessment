using MediatR;

namespace JobTracker.Jobs.IntegrationEvents;

/// <summary>
/// Public contract of the Jobs module — other bounded contexts (e.g., Billing,
/// Notifications) subscribe to this event without coupling to Job internals.
/// This is an Open Host Service (OHS) pattern: the IntegrationEvents project
/// is the published language that other modules depend on.
/// </summary>
public sealed record JobCompletedIntegrationEvent(
    Guid Id,
    Guid JobId,
    Guid OrganizationId,
    Guid CustomerId,
    Guid? AssigneeId,
    string SignatureUrl,
    DateTime CompletedAt,
    string IdempotencyKey
) : INotification;
