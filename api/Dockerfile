# --- Build ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY api.csproj .
RUN dotnet restore api.csproj
COPY . .
RUN dotnet publish api.csproj -c Release -o /app /p:UseAppHost=false

# --- Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
# La plupart des hébergeurs (Render/Railway) injectent $PORT ; défaut 8080 sinon.
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
# La base SQLite est créée + migrée + seedée au démarrage (Program.cs).
ENTRYPOINT ["dotnet", "api.dll"]
