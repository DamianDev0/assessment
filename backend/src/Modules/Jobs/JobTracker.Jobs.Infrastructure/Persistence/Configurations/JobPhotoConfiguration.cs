using JobTracker.Jobs.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobTracker.Jobs.Infrastructure.Persistence.Configurations;

internal sealed class JobPhotoConfiguration : IEntityTypeConfiguration<JobPhoto>
{
    public void Configure(EntityTypeBuilder<JobPhoto> builder)
    {
        builder.ToTable("job_photos");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Url).IsRequired().HasMaxLength(2048);
        builder.Property(p => p.Caption).HasMaxLength(500);
        builder.Property(p => p.CapturedAt).IsRequired().HasColumnType("timestamptz");
    }
}
