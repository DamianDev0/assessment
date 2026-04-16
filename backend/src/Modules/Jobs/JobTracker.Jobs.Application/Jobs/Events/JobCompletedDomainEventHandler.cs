using JobTracker.Jobs.Domain.Events;
using JobTracker.Jobs.IntegrationEvents;
using MediatR;
using Microsoft.Extensions.Logging;

namespace JobTracker.Jobs.Application.Jobs.Events;

// ---------------------------------------------------------------------------
// DOMAIN EVENTS vs INTEGRATION EVENTS
// ---------------------------------------------------------------------------
// Domain Events live WITHIN a bounded context (module). They are raised by
// aggregates during state changes and published in-process via MediatR.
// They are implementation details of the module — other modules never see them.
//
// Integration Events cross bounded context boundaries. They are the public
// contracts (defined in Jobs.IntegrationEvents) that other modules subscribe to.
// They travel through the Outbox → Hangfire pipeline, not in-process.
//
// This handler bridges the two: it receives a domain event and publishes
// the corresponding integration event via IPublisher so it enters the outbox.
// ---------------------------------------------------------------------------
//
// WHY OUTBOX PATTERN ENSURES AT-LEAST-ONCE DELIVERY
// ---------------------------------------------------------------------------
// The InsertOutboxMessagesInterceptor serializes domain events into the
// outbox_messages table in the SAME database transaction as the aggregate
// mutation. This means:
//   - If SaveChanges succeeds → the outbox message is persisted (guaranteed)
//   - If SaveChanges fails   → both the mutation and the message are rolled back
//
// The ProcessOutboxMessagesJob (Hangfire, every minute) polls unprocessed
// messages and publishes them. If the process crashes after SaveChanges but
// before Hangfire publishes, the message remains in the outbox with
// processed_on = NULL and will be retried on the next cycle.
//
// This guarantees at-least-once delivery: messages may be delivered more than
// once (if the process crashes after publish but before marking processed_on),
// but they are NEVER lost.
// ---------------------------------------------------------------------------
//
// HOW IDEMPOTENCY IS GUARANTEED IN THE INVOICE HANDLER
// ---------------------------------------------------------------------------
// Since at-least-once means duplicate deliveries are possible, the consumer
// (invoice handler in the Billing module) MUST be idempotent. We achieve this
// with an idempotency key: "{JobId}-{CompletedAt:yyyyMMdd}".
//
// Before creating an invoice, the Billing handler checks:
//   IF EXISTS (SELECT 1 FROM billing.invoices WHERE idempotency_key = @key)
//     → skip (already processed)
//   ELSE
//     → create invoice with idempotency_key = @key
//
// This ensures that even if the same JobCompletedIntegrationEvent is delivered
// 5 times, only ONE invoice is ever created for that job completion.
// ---------------------------------------------------------------------------

internal sealed class JobCompletedDomainEventHandler(
    IPublisher publisher,
    ILogger<JobCompletedDomainEventHandler> logger
) : INotificationHandler<JobCompletedDomainEvent>
{
    public async Task Handle(JobCompletedDomainEvent notification, CancellationToken cancellationToken)
    {
        var integrationEvent = new JobCompletedIntegrationEvent(
            Guid.NewGuid(),
            notification.JobId,
            notification.OrganizationId,
            notification.CustomerId,
            notification.AssigneeId,
            notification.SignatureUrl,
            notification.CompletedAt,
            IdempotencyKey: $"{notification.JobId}-{notification.CompletedAt:yyyyMMdd}");

        logger.LogInformation(
            "Job {JobId} completed. Publishing integration event with idempotency key {Key}",
            notification.JobId, integrationEvent.IdempotencyKey);

        // Publish the integration event so it can be picked up by handlers
        // in other bounded contexts (e.g., Billing module for invoice generation,
        // Notifications module for customer email via SendGrid).
        await publisher.Publish(integrationEvent, cancellationToken);
    }
}
