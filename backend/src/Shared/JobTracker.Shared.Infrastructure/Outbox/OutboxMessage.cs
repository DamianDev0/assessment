namespace JobTracker.Shared.Infrastructure.Outbox;

public sealed class OutboxMessage
{
    public Guid Id { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public DateTime OccurredOn { get; private set; }
    public DateTime? ProcessedOn { get; private set; }

    private OutboxMessage() { }

    public static OutboxMessage Create(string type, string content) => new()
    {
        Id = Guid.NewGuid(),
        Type = type,
        Content = content,
        OccurredOn = DateTime.UtcNow
    };

    public void MarkProcessed() => ProcessedOn = DateTime.UtcNow;
}
