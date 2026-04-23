namespace console_api.Models;

public enum JobStatus { Pending, Printing, Completed, Failed }

public class PrintJob
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public PrintingAgent Agent { get; set; } = null!;
    public string PrinterName { get; set; } = "";
    public string FileName { get; set; } = "";
    public byte[] FileData { get; set; } = Array.Empty<byte>();
    // When set the printing service downloads the file directly — FileData will be empty
    public string? SourceUrl { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Pending;
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
