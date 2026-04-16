namespace JobTracker.Shared.Domain;

public abstract class ValueObject
{
    protected abstract IEnumerable<object> GetAtomicValues();

    public override bool Equals(object? obj)
    {
        if (obj is not ValueObject other) return false;
        if (other.GetType() != GetType()) return false;
        return GetAtomicValues().SequenceEqual(other.GetAtomicValues());
    }

    public override int GetHashCode() =>
        GetAtomicValues().Aggregate(0, HashCode.Combine);

    public static bool operator ==(ValueObject? a, ValueObject? b) =>
        a?.Equals(b) ?? b is null;

    public static bool operator !=(ValueObject? a, ValueObject? b) => !(a == b);
}
