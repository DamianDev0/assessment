using JobTracker.Shared.Domain;
using JobTracker.Shared.Domain.Primitives;

namespace JobTracker.Jobs.Domain.ValueObjects;

public sealed class Address : ValueObject
{
    public string Street { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string State { get; private set; } = string.Empty;
    public string ZipCode { get; private set; } = string.Empty;
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }

    private Address() { }

    public static Result<Address> Create(
        string street,
        string city,
        string state,
        string zipCode,
        double latitude,
        double longitude)
    {
        if (string.IsNullOrWhiteSpace(street))
            return Result.Failure<Address>(AddressErrors.StreetRequired);

        if (string.IsNullOrWhiteSpace(city))
            return Result.Failure<Address>(AddressErrors.CityRequired);

        if (string.IsNullOrWhiteSpace(state))
            return Result.Failure<Address>(AddressErrors.StateRequired);

        if (string.IsNullOrWhiteSpace(zipCode))
            return Result.Failure<Address>(AddressErrors.ZipCodeRequired);

        if (latitude is < -90 or > 90)
            return Result.Failure<Address>(AddressErrors.InvalidLatitude);

        if (longitude is < -180 or > 180)
            return Result.Failure<Address>(AddressErrors.InvalidLongitude);

        return Result.Success(new Address
        {
            Street = street.Trim(),
            City = city.Trim(),
            State = state.Trim(),
            ZipCode = zipCode.Trim(),
            Latitude = latitude,
            Longitude = longitude
        });
    }

    protected override IEnumerable<object> GetAtomicValues()
    {
        yield return Street;
        yield return City;
        yield return State;
        yield return ZipCode;
        yield return Latitude;
        yield return Longitude;
    }
}

public static class AddressErrors
{
    public static readonly Error StreetRequired = new("Address.StreetRequired", "Street is required.");
    public static readonly Error CityRequired = new("Address.CityRequired", "City is required.");
    public static readonly Error StateRequired = new("Address.StateRequired", "State is required.");
    public static readonly Error ZipCodeRequired = new("Address.ZipCodeRequired", "Zip code is required.");
    public static readonly Error InvalidLatitude = new("Address.InvalidLatitude", "Latitude must be between -90 and 90.");
    public static readonly Error InvalidLongitude = new("Address.InvalidLongitude", "Longitude must be between -180 and 180.");
}
