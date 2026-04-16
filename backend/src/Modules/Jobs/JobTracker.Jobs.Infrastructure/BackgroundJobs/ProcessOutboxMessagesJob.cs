using JobTracker.Shared.Infrastructure.Outbox;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using JobTracker.Jobs.Infrastructure.Persistence;

namespace JobTracker.Jobs.Infrastructure.BackgroundJobs;

public sealed class ProcessOutboxMessagesJob(
    JobsDbContext context,
    IPublisher publisher,
    ILogger<ProcessOutboxMessagesJob> logger
)
{
    private const int BatchSize = 20;

    public async Task Execute()
    {
        var messages = await context.OutboxMessages
            .Where(m => m.ProcessedOn == null)
            .OrderBy(m => m.OccurredOn)
            .Take(BatchSize)
            .ToListAsync();

        foreach (var message in messages)
        {
            try
            {
                var eventType = Type.GetType(message.Type);
                if (eventType is null)
                {
                    logger.LogWarning("Unknown outbox message type: {Type}", message.Type);
                    continue;
                }

                var domainEvent = JsonSerializer.Deserialize(message.Content, eventType);
                if (domainEvent is null)
                {
                    logger.LogWarning("Failed to deserialize outbox message {Id}", message.Id);
                    continue;
                }

                await publisher.Publish(domainEvent, CancellationToken.None);
                message.MarkProcessed();
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process outbox message {Id}", message.Id);
            }
        }
    }
}
