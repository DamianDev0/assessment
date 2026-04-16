using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobTracker.Jobs.Infrastructure.Persistence.Configurations;

internal sealed class JobConfiguration : IEntityTypeConfiguration<Job>
{
    public void Configure(EntityTypeBuilder<Job> builder)
    {
        builder.ToTable("jobs");
        builder.HasKey(j => j.Id);

        builder.Property(j => j.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(j => j.Description)
            .IsRequired()
            .HasMaxLength(2000)
            .HasDefaultValue(string.Empty);

        builder.Property(j => j.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.OwnsOne(j => j.Address, address =>
        {
            address.Property(a => a.Street).HasColumnName("street").IsRequired();
            address.Property(a => a.City).HasColumnName("city").IsRequired();
            address.Property(a => a.State).HasColumnName("state").IsRequired().HasMaxLength(50);
            address.Property(a => a.ZipCode).HasColumnName("zip_code").IsRequired().HasMaxLength(10);
            address.Property(a => a.Latitude).HasColumnName("latitude");
            address.Property(a => a.Longitude).HasColumnName("longitude");
        });

        builder.Property(j => j.ScheduledDate).HasColumnType("timestamptz");
        builder.Property(j => j.CreatedAt).IsRequired().HasColumnType("timestamptz");
        builder.Property(j => j.UpdatedAt).IsRequired().HasColumnType("timestamptz");

        builder.HasIndex(j => j.OrganizationId)
            .HasDatabaseName("idx_jobs_org_id");

        builder.HasIndex(j => new { j.OrganizationId, j.Status })
            .HasDatabaseName("idx_jobs_org_status");

        builder.HasIndex(j => new { j.OrganizationId, j.ScheduledDate })
            .HasDatabaseName("idx_jobs_org_date");

        builder.HasIndex(j => new { j.OrganizationId, j.AssigneeId })
            .HasDatabaseName("idx_jobs_org_assignee");

        builder.HasMany(j => j.Photos)
            .WithOne()
            .HasForeignKey(p => p.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(j => j.Photos).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Property<uint>("xmin").IsRowVersion();
    }
}
