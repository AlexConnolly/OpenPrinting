namespace console_api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string? DisplayName { get; set; }
    public string? PasswordHash { get; set; }
    public string? OAuthSubject { get; set; }
    public DateTime CreatedAt { get; set; }
}
