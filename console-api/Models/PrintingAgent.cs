namespace console_api.Models;

public class PrintingAgent
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string MachineName { get; set; } = "";
    public DateTime LastSeen { get; set; }
    public DateTime RegisteredAt { get; set; }
    public List<AgentPrinter> Printers { get; set; } = new();
}

public class AgentPrinter
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public string Name { get; set; } = "";
    public bool IsDefault { get; set; }
}
