using JobTracker.Shared.Domain;
using JobTracker.Shared.Infrastructure.Outbox;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Text.Json;

namespace JobTracker.Jobs.Infrastructure.Interceptors;

public sealed class InsertOutboxMessagesInterceptor : SaveChangesInterceptor
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        WriteIndented = false
    };

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return base.SavingChangesAsync(eventData, result, cancellationToken);

        var outboxMessages = eventData.Context.ChangeTracker
            .Entries<AggregateRoot>()
            .SelectMany(entry => entry.Entity.DomainEvents)
            .Select(domainEvent => OutboxMessage.Create(
                type: domainEvent.GetType().AssemblyQualifiedName!,
                content: JsonSerializer.Serialize(domainEvent, domainEvent.GetType(), SerializerOptions)))
            .ToList();

        foreach (var entry in eventData.Context.ChangeTracker.Entries<AggregateRoot>())
            entry.Entity.ClearDomainEvents();

        if (outboxMessages.Count > 0)
            eventData.Context.Set<OutboxMessage>().AddRange(outboxMessages);

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
