using System.Threading.RateLimiting;
using Hangfire;
using Hangfire.PostgreSql;
using JobTracker.Jobs.Application;
using JobTracker.Jobs.Infrastructure;
using JobTracker.Jobs.Infrastructure.BackgroundJobs;
using JobTracker.Jobs.Infrastructure.Persistence;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' not found.");

builder.Services.AddJobsApplication();
builder.Services.AddJobsInfrastructure(connectionString);

builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString)));
builder.Services.AddHangfireServer();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Rate limiting — sliding window per tenant (fallback to IP).
// 100 requests per minute split across 6 segments (10s each).
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
    {
        var partitionKey = ctx.Request.Headers["X-Organization-Id"].ToString();
        if (string.IsNullOrEmpty(partitionKey))
        {
            partitionKey = ctx.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        }

        return RateLimitPartition.GetSlidingWindowLimiter(partitionKey, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6,
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        });
    });
});

// OpenTelemetry — traces ASP.NET Core, EF Core, outgoing HTTP.
// Exports to OTLP endpoint (e.g. Jaeger, Tempo) in prod; Console in dev.
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService(
        serviceName: "JobTracker.Jobs.Api",
        serviceVersion: "1.0.0",
        serviceInstanceId: Environment.MachineName))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation(o =>
            {
                o.RecordException = true;
                o.Filter = ctx => !ctx.Request.Path.StartsWithSegments("/hangfire");
            })
            .AddHttpClientInstrumentation()
            .AddEntityFrameworkCoreInstrumentation(o => o.SetDbStatementForText = true);

        var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
        if (!string.IsNullOrEmpty(otlpEndpoint))
        {
            tracing.AddOtlpExporter(opts => opts.Endpoint = new Uri(otlpEndpoint));
        }
        else if (builder.Environment.IsDevelopment())
        {
            tracing.AddConsoleExporter();
        }
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<JobsDbContext>();
    await db.Database.MigrateAsync();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRateLimiter();
app.MapControllers();
app.UseHangfireDashboard("/hangfire");

RecurringJob.AddOrUpdate<ProcessOutboxMessagesJob>(
    "process-outbox",
    job => job.Execute(),
    Cron.Minutely);

var logger = app.Services.GetRequiredService<ILogger<Program>>();
var urls = builder.Configuration["ASPNETCORE_URLS"]
    ?? builder.Configuration["urls"]
    ?? "http://localhost:5050";
logger.LogInformation("API:      {Urls}/api/jobs", urls);
logger.LogInformation("Swagger:  {Urls}/swagger", urls);
logger.LogInformation("Hangfire: {Urls}/hangfire", urls);

app.Run();

public partial class Program;
