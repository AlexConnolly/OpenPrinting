using System.Text.Json;
using RabbitMQ.Client;

namespace console_api.Services;

public record PrintJobMessage(int JobId, string PrinterName, string FileName, string? SourceUrl);

public interface IJobQueue
{
    void Publish(int agentId, string printerName, PrintJobMessage message);
    PrintJobMessage? TryDequeue(int agentId, string printerName);
}

// Default: DB polling — the printing service pulls via GET /jobs/next and the DB is the queue.
// No external dependencies required.
public class DbJobQueue : IJobQueue
{
    public void Publish(int agentId, string printerName, PrintJobMessage message) { }
    public PrintJobMessage? TryDequeue(int agentId, string printerName) => null;
}

// Optional: RabbitMQ — bundled in Docker by default, or point at your own instance.
// Enabled when RabbitMq:Host is set. The printing service still just polls GET /jobs/next;
// the queue is an internal API detail.
public class RabbitMqJobQueue : IJobQueue, IHostedService, IDisposable
{
    private IConnection? _connection;
    private readonly IConfiguration _config;
    private readonly ILogger<RabbitMqJobQueue> _logger;

    public RabbitMqJobQueue(IConfiguration config, ILogger<RabbitMqJobQueue> logger)
    {
        _config = config;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory
        {
            HostName               = _config["RabbitMq:Host"]!,
            UserName               = _config["RabbitMq:User"] ?? "guest",
            Password               = _config["RabbitMq:Pass"] ?? "guest",
            DispatchConsumersAsync = true,
        };
        _connection = factory.CreateConnection("console-api");
        _logger.LogInformation("RabbitMQ connected ({Host})", factory.HostName);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _connection?.Close();
        return Task.CompletedTask;
    }

    public void Publish(int agentId, string printerName, PrintJobMessage message)
    {
        using var channel = _connection!.CreateModel();
        var queue = QueueName(agentId, printerName);
        channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);

        var props = channel.CreateBasicProperties();
        props.Persistent = true;
        channel.BasicPublish("", queue, props, JsonSerializer.SerializeToUtf8Bytes(message));
    }

    public PrintJobMessage? TryDequeue(int agentId, string printerName)
    {
        using var channel = _connection!.CreateModel();
        var queue = QueueName(agentId, printerName);
        channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);

        var result = channel.BasicGet(queue, autoAck: false);
        if (result == null) return null;

        var message = JsonSerializer.Deserialize<PrintJobMessage>(result.Body.Span);
        channel.BasicAck(result.DeliveryTag, multiple: false);
        return message;
    }

    private static string QueueName(int agentId, string printerName) =>
        $"print.{agentId}.{Uri.EscapeDataString(printerName)}";

    public void Dispose() => _connection?.Dispose();
}
