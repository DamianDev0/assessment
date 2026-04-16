using FluentAssertions;
using JobTracker.Jobs.Domain.ValueObjects;
using Xunit;

namespace JobTracker.Jobs.Domain.Tests;

public sealed class AddressValueObjectTests
{
    [Fact]
    public void TwoAddresses_WithSameValues_AreEqual()
    {
        var a1 = Address.Create("123 Main", "Miami", "FL", "33101", 25.77, -80.19).Value;
        var a2 = Address.Create("123 Main", "Miami", "FL", "33101", 25.77, -80.19).Value;

        a1.Should().Be(a2);
        (a1 == a2).Should().BeTrue();
    }

    [Fact]
    public void TwoAddresses_WithDifferentCity_AreNotEqual()
    {
        var a1 = Address.Create("123 Main", "Miami", "FL", "33101", 25.77, -80.19).Value;
        var a2 = Address.Create("123 Main", "Orlando", "FL", "33101", 25.77, -80.19).Value;

        a1.Should().NotBe(a2);
    }

    [Fact]
    public void Create_WithEmptyStreet_ReturnsFailure()
    {
        var result = Address.Create("", "Miami", "FL", "33101", 25.77, -80.19);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Address.StreetRequired");
    }

    [Fact]
    public void Create_WithInvalidLatitude_ReturnsFailure()
    {
        var result = Address.Create("123 Main", "Miami", "FL", "33101", 91.0, -80.19);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Address.InvalidLatitude");
    }
}
