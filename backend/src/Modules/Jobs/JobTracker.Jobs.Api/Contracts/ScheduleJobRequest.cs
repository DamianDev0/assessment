namespace JobTracker.Jobs.Api.Contracts;

public sealed record ScheduleJobRequest(DateTime ScheduledDate, Guid AssigneeId);
