using System.Security.Claims;
using console_api.Data;
using console_api.Models;
using console_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace console_api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;
    private readonly OAuthService _oauth;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, JwtService jwt, OAuthService oauth, IConfiguration config)
    {
        _db = db;
        _jwt = jwt;
        _oauth = oauth;
        _config = config;
    }

    // Tells the login page what buttons to render — no sensitive config leaves the server
    [HttpGet("config")]
    public IActionResult GetConfig() => Ok(new
    {
        oauthEnabled = _oauth.IsConfigured,
        localLoginEnabled = _config.GetValue<bool>("Auth:AllowLocalLogin"),
    });

    // True when local login is on and no users exist yet — shows the setup page
    [HttpGet("needs-setup")]
    public async Task<IActionResult> NeedsSetup() => Ok(new
    {
        needsSetup = _config.GetValue<bool>("Auth:AllowLocalLogin") && !await _db.Users.AnyAsync(),
    });

    // One-time endpoint to create the first local user; disabled once any user exists
    [HttpPost("setup")]
    public async Task<IActionResult> Setup([FromBody] SetupRequest req)
    {
        if (!_config.GetValue<bool>("Auth:AllowLocalLogin"))
            return BadRequest(new { error = "Local login is disabled." });

        if (await _db.Users.AnyAsync())
            return BadRequest(new { error = "Setup already completed." });

        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Email and password are required." });

        var user = new User
        {
            Email = req.Email.Trim(),
            DisplayName = req.Name?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            CreatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { token = _jwt.GenerateToken(user) });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!_config.GetValue<bool>("Auth:AllowLocalLogin"))
            return BadRequest(new { error = "Local login is disabled." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.Trim());
        if (user?.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password." });

        return Ok(new { token = _jwt.GenerateToken(user) });
    }

    // Starts the OAuth flow. Desktop clients may pass a loopback returnUrl to receive
    // the token directly instead of being redirected to the web frontend.
    [HttpGet("oauth/initiate")]
    public IActionResult InitiateOAuth([FromQuery] string? returnUrl = null)
    {
        if (!_oauth.IsConfigured)
            return BadRequest(new { error = "OAuth is not configured." });

        if (returnUrl != null && !OAuthService.IsLoopbackUrl(returnUrl))
            return BadRequest(new { error = "returnUrl must be a loopback address." });

        var state = _oauth.GenerateState(returnUrl);
        return Ok(new { url = _oauth.BuildAuthorizationUrl(state) });
    }

    // Provider redirects here after the user authenticates
    [HttpGet("oauth/callback")]
    public async Task<IActionResult> OAuthCallback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error)
    {
        var frontendUrl = _config["App:FrontendUrl"] ?? "http://localhost:5173";
        IActionResult errorRedirect(string msg, string? returnUrl = null)
        {
            var dest = returnUrl ?? $"{frontendUrl}/oauth-callback";
            return Redirect($"{dest}?error={Uri.EscapeDataString(msg)}");
        }

        if (string.IsNullOrEmpty(state)) return errorRedirect("missing_parameters");

        var (valid, returnUrl) = _oauth.ConsumeState(state);
        if (!valid) return errorRedirect("invalid_or_expired_state");

        if (error != null) return errorRedirect(error, returnUrl);
        if (string.IsNullOrEmpty(code)) return errorRedirect("missing_parameters", returnUrl);

        try
        {
            var (email, displayName, subject) = await _oauth.ExchangeCodeForUserInfo(code);

            var user = await _db.Users.FirstOrDefaultAsync(u => u.OAuthSubject == subject)
                    ?? await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                user = new User
                {
                    Email = email,
                    DisplayName = displayName,
                    OAuthSubject = subject,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.Users.Add(user);
            }
            else
            {
                user.OAuthSubject ??= subject;
                if (displayName != null) user.DisplayName ??= displayName;
            }

            await _db.SaveChangesAsync();

            var token = Uri.EscapeDataString(_jwt.GenerateToken(user));
            // For loopback desktop flows, bounce through the frontend so the browser
            // never navigates away from our page — the frontend delivers the token via fetch.
            if (returnUrl != null && OAuthService.IsLoopbackUrl(returnUrl))
                return Redirect($"{frontendUrl}/oauth-callback?token={token}&returnUrl={Uri.EscapeDataString(returnUrl)}");

            var dest = returnUrl ?? $"{frontendUrl}/oauth-callback";
            return Redirect($"{dest}?token={token}");
        }
        catch
        {
            return errorRedirect("authentication_failed", returnUrl);
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        return Ok(new { user.Id, user.Email, user.DisplayName });
    }
}

public record SetupRequest(string Email, string Password, string? Name);
public record LoginRequest(string Email, string Password);
