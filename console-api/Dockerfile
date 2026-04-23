FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app --no-self-contained

FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=build /app .
VOLUME /data
ENTRYPOINT ["dotnet", "console-api.dll"]
