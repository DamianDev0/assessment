namespace JobTracker.Jobs.Domain.Entities;

public sealed class JobPhoto
{
    public Guid Id { get; private set; }
    public Guid JobId { get; private set; }
    public string Url { get; private set; } = string.Empty;
    public DateTime CapturedAt { get; private set; }
    public string? Caption { get; private set; }

    private JobPhoto() { }

    internal static JobPhoto Create(Guid jobId, string url, string? caption) => new()
    {
        Id = Guid.NewGuid(),
        JobId = jobId,
        Url = url,
        CapturedAt = DateTime.UtcNow,
        Caption = caption
    };
}
