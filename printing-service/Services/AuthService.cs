using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text;
using System.Web;

namespace printing_service.Services;

public class AuthService
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;
    private readonly TokenStore _tokenStore;
    private readonly ILogger<AuthService> _logger;

    private string? _token;

    public AuthService(
        IConfiguration config,
        IHttpClientFactory httpFactory,
        TokenStore tokenStore,
        ILogger<AuthService> logger)
    {
        _config = config;
        _httpFactory = httpFactory;
        _tokenStore = tokenStore;
        _logger = logger;
    }

    public string Token => _token ?? throw new InvalidOperationException("Not authenticated.");

    public async Task EnsureAuthenticatedAsync(CancellationToken ct = default)
    {
        _token = _tokenStore.Load();
        if (_token != null)
        {
            _logger.LogInformation("Using stored token.");
            return;
        }

        _logger.LogInformation("No valid token — opening browser for login.");
        _token = await LoginViaBrowserAsync(ct);
        _tokenStore.Save(_token);
        _logger.LogInformation("Authentication successful — token saved.");
    }

    private async Task<string> LoginViaBrowserAsync(CancellationToken ct)
    {
        // TcpListener works without elevated privileges or URL ACL reservations
        var tcp = new TcpListener(IPAddress.Loopback, 0);
        tcp.Start();
        var port = ((IPEndPoint)tcp.LocalEndpoint).Port;
        var callbackUrl = $"http://127.0.0.1:{port}/";

        _logger.LogInformation("Listening for callback on {Url}", callbackUrl);

        var loginUrl = $"{ServerUrl}/login?returnUrl={Uri.EscapeDataString(callbackUrl)}";
        _logger.LogInformation("Opening browser: {Url}", loginUrl);
        OpenBrowser(loginUrl);

        // Wait up to 5 minutes for the browser to hit the callback
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromMinutes(5));

        TcpClient client;
        try
        {
            client = await tcp.AcceptTcpClientAsync(timeoutCts.Token);
        }
        catch (OperationCanceledException)
        {
            tcp.Stop();
            throw new TimeoutException("Login timed out — no response received within 5 minutes.");
        }

        tcp.Stop();

        using var stream = client.GetStream();
        var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);

        // Read the HTTP request line: GET /?token=...&... HTTP/1.1
        var requestLine = await reader.ReadLineAsync();
        _logger.LogDebug("Callback request: {Line}", requestLine);

        string? token = null;
        string? error = null;

        if (requestLine != null)
        {
            // Extract the path+query from "GET /path?query HTTP/1.1"
            var parts = requestLine.Split(' ');
            if (parts.Length >= 2)
            {
                var pathAndQuery = parts[1];
                var queryStart = pathAndQuery.IndexOf('?');
                if (queryStart >= 0)
                {
                    var query = HttpUtility.ParseQueryString(pathAndQuery[(queryStart + 1)..]);
                    token = query["token"];
                    error = query["error"];
                }
            }
        }

        // Send a minimal HTTP response so the browser renders something
        var (status, body) = token != null
            ? ("200 OK", "<html><body style='font-family:sans-serif;padding:2rem'><h2>Login successful</h2><p>You can close this window.</p></body></html>")
            : ("400 Bad Request", $"<html><body style='font-family:sans-serif;padding:2rem'><h2>Login failed</h2><p>{WebUtility.HtmlEncode(error ?? "Unknown error")}</p></body></html>");

        var response = $"HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nConnection: close\r\n\r\n{body}";
        var responseBytes = Encoding.UTF8.GetBytes(response);
        await stream.WriteAsync(responseBytes, ct);

        if (token == null)
            throw new Exception($"Login failed: {error}");

        return token;
    }

    private string ServerUrl => (_config["PrintingService:ServerUrl"]
        ?? throw new InvalidOperationException("PrintingService:ServerUrl is not configured.")).TrimEnd('/');

    private static void OpenBrowser(string url) =>
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(url) { UseShellExecute = true });
}
