FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["src/Shared/JobTracker.Shared.Domain/JobTracker.Shared.Domain.csproj", "src/Shared/JobTracker.Shared.Domain/"]
COPY ["src/Shared/JobTracker.Shared.Infrastructure/JobTracker.Shared.Infrastructure.csproj", "src/Shared/JobTracker.Shared.Infrastructure/"]
COPY ["src/Modules/Jobs/JobTracker.Jobs.Domain/JobTracker.Jobs.Domain.csproj", "src/Modules/Jobs/JobTracker.Jobs.Domain/"]
COPY ["src/Modules/Jobs/JobTracker.Jobs.Application/JobTracker.Jobs.Application.csproj", "src/Modules/Jobs/JobTracker.Jobs.Application/"]
COPY ["src/Modules/Jobs/JobTracker.Jobs.Infrastructure/JobTracker.Jobs.Infrastructure.csproj", "src/Modules/Jobs/JobTracker.Jobs.Infrastructure/"]
COPY ["src/Modules/Jobs/JobTracker.Jobs.Api/JobTracker.Jobs.Api.csproj", "src/Modules/Jobs/JobTracker.Jobs.Api/"]
COPY ["src/Modules/Jobs/JobTracker.Jobs.IntegrationEvents/JobTracker.Jobs.IntegrationEvents.csproj", "src/Modules/Jobs/JobTracker.Jobs.IntegrationEvents/"]

RUN dotnet restore "src/Modules/Jobs/JobTracker.Jobs.Api/JobTracker.Jobs.Api.csproj"

COPY . .
RUN dotnet publish "src/Modules/Jobs/JobTracker.Jobs.Api/JobTracker.Jobs.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "JobTracker.Jobs.Api.dll"]
