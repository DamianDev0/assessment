using FluentValidation;

namespace JobTracker.Jobs.Application.Jobs.Commands.CompleteJob;

internal sealed class CompleteJobCommandValidator : AbstractValidator<CompleteJobCommand>
{
    public CompleteJobCommandValidator()
    {
        RuleFor(x => x.JobId)
            .NotEmpty().WithMessage("Job ID is required.");

        RuleFor(x => x.SignatureUrl)
            .NotEmpty().WithMessage("Signature URL is required.")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Signature URL must be a valid absolute URL.");

        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Organization ID is required.");
    }
}
