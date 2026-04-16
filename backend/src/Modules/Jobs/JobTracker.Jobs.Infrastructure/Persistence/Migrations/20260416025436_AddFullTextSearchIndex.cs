using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Jobs.Infrastructure.Persistence.Migrations
{
    public partial class AddFullTextSearchIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE INDEX idx_jobs_fts
                ON jobs.jobs
                USING GIN (to_tsvector('english', title || ' ' || description));
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS jobs.idx_jobs_fts;");
        }
    }
}
