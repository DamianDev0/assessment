using MediatR;

namespace JobTracker.Shared.Domain;

public interface IDomainEvent : INotification
{
    Guid Id { get; }
    DateTime OccurredOn { get; }
}
