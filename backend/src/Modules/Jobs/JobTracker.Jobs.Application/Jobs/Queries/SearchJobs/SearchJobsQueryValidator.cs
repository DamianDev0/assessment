using FluentValidation;

namespace JobTracker.Jobs.Application.Jobs.Queries.SearchJobs;

internal sealed class SearchJobsQueryValidator : AbstractValidator<SearchJobsQuery>
{
    public SearchJobsQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Organization ID is required.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1.");

        RuleFor(x => x.DateFrom)
            .LessThan(x => x.DateTo)
            .When(x => x.DateFrom.HasValue && x.DateTo.HasValue)
            .WithMessage("DateFrom must be before DateTo.");
    }
}
