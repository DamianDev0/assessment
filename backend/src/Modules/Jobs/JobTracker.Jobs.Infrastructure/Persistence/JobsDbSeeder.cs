using JobTracker.Jobs.Domain.Aggregates;
using JobTracker.Jobs.Domain.ValueObjects;

namespace JobTracker.Jobs.Infrastructure.Persistence;

public static class JobsDbSeeder
{
    private static readonly Guid OrgId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid CustomerId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    private static readonly Guid Crew1 = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Crew2 = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid Crew3 = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    public static async Task SeedAsync(JobsDbContext db)
    {
        if (db.Jobs.Any()) return;

        var jobs = new List<Job>
        {
            // ── Draft (5) ────────────────────────────────────────
            Draft("Roof Inspection — 742 Evergreen Terrace",
                "Full roof inspection after storm damage. Check shingles, flashing and gutters.",
                "742 Evergreen Terrace", "Springfield", "IL", "62704", 39.78, -89.65),
            Draft("Solar Panel Mounting Prep — Schaumburg",
                "Reinforce roof decking and install mounting brackets for 24-panel solar array.",
                "1 E Schaumburg Rd", "Schaumburg", "IL", "60194", 42.03, -88.08),
            Draft("Ice Dam Prevention — Wilmette",
                "Install heat cables and improve attic insulation to prevent ice dams.",
                "611 Green Bay Rd", "Wilmette", "IL", "60091", 42.07, -87.72),
            Draft("Fascia Board Replacement — Berwyn",
                "Replace rotted fascia boards on south and east sides. Prime and paint.",
                "6700 W Cermak Rd", "Berwyn", "IL", "60402", 41.84, -87.79),
            Draft("Ventilation Upgrade — Tinley Park",
                "Add ridge vent and soffit vents to improve attic airflow.",
                "17101 S Harlem Ave", "Tinley Park", "IL", "60477", 41.57, -87.78),

            // ── Scheduled (5) ────────────────────────────────────
            Scheduled("Shingle Replacement — Downtown Office",
                "Replace damaged shingles on south-facing slope. Approx 15 squares.",
                "200 W Adams St", "Chicago", "IL", "60606", 41.87, -87.63,
                DateTime.UtcNow.AddDays(3), Crew1),
            Scheduled("Gutter Installation — Lakewood",
                "Install 6-inch aluminum gutters on new construction. 180 linear feet.",
                "1450 Lake Shore Dr", "Chicago", "IL", "60610", 41.90, -87.62,
                DateTime.UtcNow.AddDays(7), Crew2),
            Scheduled("Metal Roof Overlay — Arlington Heights",
                "Install standing seam metal roof over existing shingles.",
                "33 S Arlington Heights Rd", "Arlington Heights", "IL", "60005", 42.08, -87.98,
                DateTime.UtcNow.AddDays(5), Crew3),
            Scheduled("Skylight Replacement — Downers Grove",
                "Remove old skylight and install Velux solar-powered model.",
                "1000 Curtiss St", "Downers Grove", "IL", "60515", 41.79, -88.01,
                DateTime.UtcNow.AddDays(10), Crew1),
            Scheduled("Commercial Flat Roof — Cicero",
                "Apply two-ply modified bitumen system on 5,000 sqft commercial roof.",
                "5000 W Cermak Rd", "Cicero", "IL", "60804", 41.85, -87.75,
                DateTime.UtcNow.AddDays(14), Crew2),

            // ── InProgress (5) ───────────────────────────────────
            InProgress("Emergency Leak Repair — Oak Park",
                "Active leak in master bedroom ceiling. Tarp applied, needs permanent fix.",
                "835 N Kenilworth Ave", "Oak Park", "IL", "60302", 41.89, -87.79, Crew1),
            InProgress("Flat Roof Coating — Warehouse District",
                "Apply elastomeric coating to 3,000 sqft flat roof. Two coats required.",
                "400 N Halsted St", "Chicago", "IL", "60642", 41.88, -87.64, Crew2),
            InProgress("Cedar Shake Restoration — Winnetka",
                "Clean, treat and replace damaged cedar shakes. Preserve original look.",
                "780 Elm St", "Winnetka", "IL", "60093", 42.10, -87.73, Crew3),
            InProgress("Torch-Down Roof — Logan Square",
                "Torch-applied modified bitumen on 3-flat building.",
                "2650 N Milwaukee Ave", "Chicago", "IL", "60647", 41.92, -87.69, Crew1),
            InProgress("Storm Damage Tarp — Joliet",
                "Emergency tarping after hail damage. Full replacement pending insurance.",
                "150 N Ottawa St", "Joliet", "IL", "60432", 41.52, -88.08, Crew2),

            // ── Completed (6) ────────────────────────────────────
            Completed("Full Re-Roof — Lincoln Park Residence",
                "Tear-off and re-roof with architectural shingles. Ridge vent installed.",
                "2340 N Clark St", "Chicago", "IL", "60614", 41.92, -87.64, Crew1),
            Completed("Skylight Installation — Evanston",
                "Install two Velux skylights in attic conversion. Flashing and trim included.",
                "1600 Sherman Ave", "Evanston", "IL", "60201", 42.04, -87.68, Crew2),
            Completed("Copper Gutter Install — Lake Forest",
                "Custom half-round copper gutters on historic home. 240 linear feet.",
                "700 N Western Ave", "Lake Forest", "IL", "60045", 42.23, -87.84, Crew3),
            Completed("Rubber Roof — Wicker Park",
                "EPDM rubber membrane on flat-roof addition. 10-year warranty.",
                "1450 N Damen Ave", "Chicago", "IL", "60622", 41.90, -87.67, Crew1),
            Completed("Tile Roof Repair — Riverside",
                "Replace 30 broken clay tiles and re-seal ridge caps.",
                "27 Forest Ave", "Riverside", "IL", "60546", 41.83, -87.82, Crew2),
            Completed("Snow Guard Install — Highland Park",
                "Install snow guards on slate roof to prevent snow slides over entrance.",
                "1850 Green Bay Rd", "Highland Park", "IL", "60035", 42.18, -87.80, Crew3),

            // ── Cancelled (4) ────────────────────────────────────
            Cancelled("Chimney Flashing — Naperville",
                "Replace lead flashing around chimney. Customer cancelled due to budget.",
                "55 S Main St", "Naperville", "IL", "60540", 41.77, -88.14),
            Cancelled("Green Roof Installation — Loop",
                "Proposed green roof on 10-story building. Project on hold pending permits.",
                "120 N LaSalle St", "Chicago", "IL", "60602", 41.88, -87.63),
            Cancelled("Roof Deck Waterproofing — Bucktown",
                "Waterproof rooftop deck. Owner selling property, work cancelled.",
                "1800 N Milwaukee Ave", "Chicago", "IL", "60647", 41.91, -87.68),
            Cancelled("Asbestos Abatement — Blue Island",
                "Remove asbestos shingles. Cancelled after abatement cost exceeded estimate.",
                "13100 S Western Ave", "Blue Island", "IL", "60406", 41.65, -87.68),
        };

        db.Jobs.AddRange(jobs);
        await db.SaveChangesAsync();
    }

    private static Job Draft(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon)
    {
        var address = Address.Create(street, city, state, zip, lat, lon).Value;
        return Job.Create(title, desc, address, CustomerId, OrgId).Value;
    }

    private static Job Scheduled(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon, DateTime date, Guid assignee)
    {
        var job = Draft(title, desc, street, city, state, zip, lat, lon);
        job.Schedule(date, assignee);
        return job;
    }

    private static Job InProgress(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon, Guid assignee)
    {
        var job = Scheduled(title, desc, street, city, state, zip, lat, lon,
            DateTime.UtcNow.AddDays(30), assignee);
        job.Start();
        return job;
    }

    private static Job Completed(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon, Guid assignee)
    {
        var job = InProgress(title, desc, street, city, state, zip, lat, lon, assignee);
        job.Complete("https://signatures.jobtracker.io/" + Guid.NewGuid());
        return job;
    }

    private static Job Cancelled(string title, string desc, string street, string city,
        string state, string zip, double lat, double lon)
    {
        var job = Draft(title, desc, street, city, state, zip, lat, lon);
        job.Cancel("Customer cancelled — budget or schedule conflict");
        return job;
    }
}
