using printing_service.Services;

namespace printing_service;

public class Worker : BackgroundService
{
    private readonly AuthService _auth;
    private readonly AgentService _agent;
    private readonly JobService _jobs;
    private readonly ILogger<Worker> _logger;

    public Worker(AuthService auth, AgentService agent, JobService jobs, ILogger<Worker> logger)
    {
        _auth  = auth;
        _agent = agent;
        _jobs  = jobs;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await _auth.EnsureAuthenticatedAsync(stoppingToken);
            await _agent.HeartbeatAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "Startup failed — service cannot continue.");
            return;
        }

        _logger.LogInformation("Printing service ready. Polling for jobs every 5s.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _auth.EnsureAuthenticatedAsync(stoppingToken);
                await _agent.HeartbeatAsync(stoppingToken);

                foreach (var printer in _agent.PrinterNames)
                    await _jobs.ProcessNextAsync(printer, stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { _logger.LogError(ex, "Error in polling loop."); }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken).ContinueWith(_ => { });
        }
    }
}
