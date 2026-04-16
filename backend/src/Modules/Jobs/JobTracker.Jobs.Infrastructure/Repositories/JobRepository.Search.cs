using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Jobs.Infrastructure.Repositories;

internal sealed partial class JobRepository
{
    public async Task<CursorPage<Job>> SearchAsync(
        JobSearchCriteria criteria,
        CancellationToken cancellationToken = default)
    {
        var query = context.Jobs
            .AsNoTracking()
            .Include(j => j.Photos)
            .Where(j => j.OrganizationId == criteria.OrganizationId);

        if (criteria.Statuses is { Length: > 0 })
            query = query.Where(j => criteria.Statuses.Contains(j.Status));

        if (criteria.DateFrom.HasValue)
            query = query.Where(j => j.ScheduledDate >= criteria.DateFrom.Value);

        if (criteria.DateTo.HasValue)
            query = query.Where(j => j.ScheduledDate <= criteria.DateTo.Value);

        if (criteria.AssigneeId.HasValue)
            query = query.Where(j => j.AssigneeId == criteria.AssigneeId.Value);

        if (!string.IsNullOrWhiteSpace(criteria.SearchTerm))
        {
            query = query.Where(j =>
                EF.Functions.ToTsVector("english", j.Title + " " + j.Description)
                    .Matches(EF.Functions.PlainToTsQuery("english", criteria.SearchTerm)));
        }

        if (criteria.Cursor.HasValue)
        {
            var cursorData = await context.Jobs
                .AsNoTracking()
                .Where(j => j.Id == criteria.Cursor.Value)
                .Select(j => new { j.CreatedAt, j.Id })
                .FirstOrDefaultAsync(cancellationToken);

            if (cursorData is not null)
            {
                query = query.Where(j =>
                    j.CreatedAt < cursorData.CreatedAt ||
                    (j.CreatedAt == cursorData.CreatedAt && j.Id.CompareTo(cursorData.Id) < 0));
            }
        }

        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .ThenByDescending(j => j.Id)
            .Take(criteria.Limit + 1)
            .ToListAsync(cancellationToken);

        Guid? nextCursor = null;
        if (items.Count > criteria.Limit)
        {
            items.RemoveAt(items.Count - 1);
            nextCursor = items[^1].Id;
        }

        return new CursorPage<Job>(items, nextCursor);
    }
}
