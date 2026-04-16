using System.Data;
using JobTracker.Jobs.Application.Abstractions;
using Npgsql;

namespace JobTracker.Jobs.Infrastructure.Persistence;

internal sealed class DbConnectionFactory(string connectionString) : IDbConnectionFactory
{
    public IDbConnection CreateConnection() => new NpgsqlConnection(connectionString);
}
