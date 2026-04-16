using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.ValueObjects;

namespace JobTracker.Jobs.Infrastructure.Persistence;

public static class JobsDbSeeder
{
    private static readonly Guid OrgId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid CustomerId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    private static readonly Guid Assignee1 = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Assignee2 = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    public static async Task SeedAsync(JobsDbContext db)
    {
        if (db.Jobs.Any()) return;

        var jobs = new[]
        {
            CreateDraft("Roof Inspection — 742 Evergreen Terrace",
                "Full roof inspection after storm damage. Check shingles, flashing and gutters.",
                "742 Evergreen Terrace", "Springfield", "IL", "62704", 39.7817, -89.6501),

            CreateScheduled("Shingle Replacement — Downtown Office",
                "Replace damaged shingles on south-facing slope. Approx 15 squares.",
                "200 W Adams St", "Chicago", "IL", "60606", 41.8796, -87.6346,
                DateTime.UtcNow.AddDays(3), Assignee1),

            CreateScheduled("Gutter Installation — Lakewood",
                "Install 6-inch aluminum gutters on new construction. 180 linear feet.",
                "1450 Lake Shore Dr", "Chicago", "IL", "60610", 41.9066, -87.6268,
                DateTime.UtcNow.AddDays(7), Assignee2),

            CreateInProgress("Emergency Leak Repair — Oak Park",
                "Active leak in master bedroom ceiling. Tarp applied, needs permanent fix.",
                "835 N Kenilworth Ave", "Oak Park", "IL", "60302", 41.8940, -87.7917,
                DateTime.UtcNow.AddDays(-1), Assignee1),

            CreateInProgress("Flat Roof Coating — Warehouse District",
                "Apply elastomeric coating to 3,000 sqft flat roof. Two coats required.",
                "400 N Halsted St", "Chicago", "IL", "60642", 41.8894, -87.6472,
                DateTime.UtcNow.AddDays(-2), Assignee2),

            CreateCompleted("Full Re-Roof — Lincoln Park Residence",
                "Tear-off and re-roof with architectural shingles. Ridge vent installed.",
                "2340 N Clark St", "Chicago", "IL", "60614", 41.9267, -87.6431,
                DateTime.UtcNow.AddDays(-10), Assignee1),

            CreateCompleted("Skylight Installation — Evanston",
                "Install two Velux skylights in attic conversion. Flashing and trim included.",
                "1600 Sherman Ave", "Evanston", "IL", "60201", 42.0472, -87.6812,
                DateTime.UtcNow.AddDays(-5), Assignee2),

            CreateCancelled("Chimney Flashing — Naperville",
                "Replace lead flashing around chimney. Customer cancelled due to budget.",
                "55 S Main St", "Naperville", "IL", "60540", 41.7724, -88.1479),

            CreateDraft("Solar Panel Mounting Prep — Schaumburg",
                "Reinforce roof decking and install mounting brackets for 24-panel solar array.",
                "1 E Schaumburg Rd", "Schaumburg", "IL", "60194", 42.0334, -88.0834),

            CreateDraft("Ice Dam Prevention — Wilmette",
                "Install heat cables and improve attic insulation to prevent ice dams.",
                "611 Green Bay Rd", "Wilmette", "IL", "60091", 42.0764, -87.7228),
        };

        db.Jobs.AddRange(jobs);
        await db.SaveChangesAsync();
    }

    private static Job CreateDraft(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon)
    {
        var address = Address.Create(street, city, state, zip, lat, lon).Value;
        return Job.Create(title, desc, address, CustomerId, OrgId).Value;
    }

    private static Job CreateScheduled(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon, DateTime scheduledDate, Guid assigneeId)
    {
        var job = CreateDraft(title, desc, street, city, state, zip, lat, lon);
        job.Schedule(scheduledDate, assigneeId);
        return job;
    }

    private static Job CreateInProgress(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon, DateTime scheduledDate, Guid assigneeId)
    {
        var job = CreateScheduled(title, desc, street, city, state, zip, lat, lon,
            DateTime.UtcNow.AddDays(30), assigneeId);
        job.Start();
        return job;
    }

    private static Job CreateCompleted(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon, DateTime scheduledDate, Guid assigneeId)
    {
        var job = CreateInProgress(title, desc, street, city, state, zip, lat, lon, scheduledDate, assigneeId);
        job.Complete("https://signatures.jobtracker.io/" + Guid.NewGuid());
        return job;
    }

    private static Job CreateCancelled(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon)
    {
        var job = CreateDraft(title, desc, street, city, state, zip, lat, lon);
        job.Cancel("Customer cancelled due to budget constraints");
        return job;
    }
}
