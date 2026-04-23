using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace console_api.Services;

public record OAuthState(string? ReturnUrl);

public class OAuthService
{
    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _config;

    public OAuthService(HttpClient http, IMemoryCache cache, IConfiguration config)
    {
        _http = http;
        _cache = cache;
        _config = config;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_config["Auth:OAuth:ClientId"]);

    // returnUrl is only accepted if it is a loopback address (desktop client callback)
    public string GenerateState(string? returnUrl = null)
    {
        var state = Guid.NewGuid().ToString("N");
        _cache.Set($"oauth_state:{state}", new OAuthState(returnUrl), TimeSpan.FromMinutes(5));
        return state;
    }

    public (bool Valid, string? ReturnUrl) ConsumeState(string state)
    {
        if (_cache.TryGetValue($"oauth_state:{state}", out OAuthState? s))
        {
            _cache.Remove($"oauth_state:{state}");
            return (true, s?.ReturnUrl);
        }
        return (false, null);
    }

    public string BuildAuthorizationUrl(string state)
    {
        var qs = QueryString.Create(new Dictionary<string, string?>
        {
            ["client_id"] = _config["Auth:OAuth:ClientId"],
            ["redirect_uri"] = _config["App:ApiCallbackUrl"],
            ["response_type"] = "code",
            ["scope"] = _config["Auth:OAuth:Scopes"] ?? "openid email profile",
            ["state"] = state,
        });
        return _config["Auth:OAuth:AuthorizationUrl"] + qs;
    }

    public async Task<(string email, string? displayName, string subject)> ExchangeCodeForUserInfo(string code)
    {
        var tokenResponse = await _http.PostAsync(_config["Auth:OAuth:TokenUrl"], new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = _config["App:ApiCallbackUrl"]!,
                ["client_id"] = _config["Auth:OAuth:ClientId"]!,
                ["client_secret"] = _config["Auth:OAuth:ClientSecret"]!,
            }));

        tokenResponse.EnsureSuccessStatusCode();
        var tokenDoc = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync());
        var accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString()
            ?? throw new Exception("No access_token in token response");

        var request = new HttpRequestMessage(HttpMethod.Get, _config["Auth:OAuth:UserInfoUrl"]);
        request.Headers.Authorization = new("Bearer", accessToken);
        var userInfoResponse = await _http.SendAsync(request);
        userInfoResponse.EnsureSuccessStatusCode();

        var root = JsonDocument.Parse(await userInfoResponse.Content.ReadAsStringAsync()).RootElement;

        var emailClaim = _config["Auth:OAuth:EmailClaim"] ?? "email";
        var nameClaim = _config["Auth:OAuth:NameClaim"] ?? "name";

        var email = root.GetProperty(emailClaim).GetString()
            ?? throw new Exception($"Claim '{emailClaim}' missing from userinfo");

        var subject = root.TryGetProperty("sub", out var subEl) ? subEl.GetString() ?? email : email;

        string? displayName = null;
        if (root.TryGetProperty(nameClaim, out var nameEl))
            displayName = nameEl.GetString();

        return (email, displayName, subject);
    }

    public static bool IsLoopbackUrl(string? url) =>
        url != null &&
        Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
        uri.Scheme == "http" &&
        (uri.Host == "127.0.0.1" || uri.Host == "localhost");
}
