using printing_service;
using printing_service.Services;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddWindowsService(options =>
    options.ServiceName = "OpenPrinting Printing Service");

var serverUrl = builder.Configuration["PrintingService:ServerUrl"]
    ?? throw new InvalidOperationException("PrintingService:ServerUrl is not configured.");

builder.Services.AddHttpClient("api", client =>
{
    client.BaseAddress = new Uri(serverUrl.TrimEnd('/') + "/");
});

builder.Services.AddSingleton<TokenStore>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<AgentService>();
builder.Services.AddSingleton<JobService>();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
