using System.Drawing.Printing;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace printing_service.Services;

public class AgentService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly AuthService _auth;
    private readonly ILogger<AgentService> _logger;

    public int? AgentId { get; private set; }
    public IReadOnlyList<string> PrinterNames { get; private set; } = Array.Empty<string>();

    public AgentService(IHttpClientFactory httpFactory, AuthService auth, ILogger<AgentService> logger)
    {
        _httpFactory = httpFactory;
        _auth = auth;
        _logger = logger;
    }

    public async Task HeartbeatAsync(CancellationToken ct = default)
    {
        var printers = GetInstalledPrinters();
        _logger.LogInformation("Sending heartbeat — {Count} printer(s) found.", printers.Count);

        var client = ApiClient();
        var response = await client.PostAsJsonAsync("api/agents/heartbeat", new
        {
            machineName = Environment.MachineName,
            printers = printers.Select(p => new { name = p.Name, isDefault = p.IsDefault }).ToList(),
        }, ct);

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        AgentId = body.GetProperty("id").GetInt32();
        PrinterNames = printers.Select(p => p.Name).ToList();
    }

    public HttpClient ApiClient()
    {
        var client = _httpFactory.CreateClient("api");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _auth.Token);
        return client;
    }

    private static List<(string Name, bool IsDefault)> GetInstalledPrinters()
    {
        string defaultPrinter;
        try { defaultPrinter = new PrinterSettings().PrinterName; }
        catch { defaultPrinter = ""; }

        var list = new List<(string, bool)>();
        foreach (string name in PrinterSettings.InstalledPrinters)
            list.Add((name, name == defaultPrinter));

        return list;
    }
}
