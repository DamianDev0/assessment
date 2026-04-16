using JobTracker.Shared.Infrastructure.Outbox;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobTracker.Jobs.Infrastructure.Persistence.Configurations;

internal sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox_messages");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Type).IsRequired().HasMaxLength(500);
        builder.Property(o => o.Content).IsRequired().HasColumnType("jsonb");
        builder.Property(o => o.OccurredOn).IsRequired().HasColumnType("timestamptz");
        builder.Property(o => o.ProcessedOn).HasColumnType("timestamptz");

        builder.HasIndex(o => o.OccurredOn)
            .HasFilter("processed_on IS NULL")
            .HasDatabaseName("idx_outbox_unprocessed");
    }
}
