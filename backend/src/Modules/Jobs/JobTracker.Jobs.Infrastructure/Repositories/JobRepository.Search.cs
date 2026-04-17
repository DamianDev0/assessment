using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Jobs.Infrastructure.Repositories;

internal sealed partial class JobRepository
{
    public async Task<PagedResult<Job>> SearchAsync(
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

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .ThenByDescending(j => j.Id)
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Job>(items, totalCount, criteria.Page, criteria.PageSize);
    }
}
