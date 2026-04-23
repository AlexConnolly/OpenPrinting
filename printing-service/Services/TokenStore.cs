using System.IdentityModel.Tokens.Jwt;

namespace printing_service.Services;

public class TokenStore
{
    private static readonly string StorePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
        "OpenPrinting", "printing-service.token");

    public string? Load()
    {
        try
        {
            if (!File.Exists(StorePath)) return null;
            var token = File.ReadAllText(StorePath).Trim();
            return IsExpired(token) ? null : token;
        }
        catch
        {
            return null;
        }
    }

    public void Save(string token)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(StorePath)!);
        File.WriteAllText(StorePath, token);
    }

    public void Clear()
    {
        if (File.Exists(StorePath))
            File.Delete(StorePath);
    }

    private static bool IsExpired(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            // Treat as expired 5 minutes early so we refresh before the server rejects it
            return jwt.ValidTo < DateTime.UtcNow.AddMinutes(5);
        }
        catch
        {
            return true;
        }
    }
}
