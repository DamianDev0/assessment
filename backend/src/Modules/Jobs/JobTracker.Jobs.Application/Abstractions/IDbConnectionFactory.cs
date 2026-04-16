using System.Data;

namespace JobTracker.Jobs.Application.Abstractions;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
