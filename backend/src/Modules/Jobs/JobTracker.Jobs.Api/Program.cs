using Hangfire;
using Hangfire.PostgreSql;
using JobTracker.Jobs.Application;
using JobTracker.Jobs.Infrastructure;
using JobTracker.Jobs.Infrastructure.BackgroundJobs;
using JobTracker.Jobs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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
