using System.Security.Claims;
using console_api.Data;
using console_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace console_api.Controllers;

[ApiController]
[Route("agents")]
[Authorize]
public class AgentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AgentsController(AppDbContext db) => _db = db;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat([FromBody] HeartbeatRequest req)
    {
        var userId = CurrentUserId;
        var now = DateTime.UtcNow;

        var agent = await _db.PrintingAgents
            .Include(a => a.Printers)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.MachineName == req.MachineName);

        if (agent == null)
        {
            agent = new PrintingAgent
            {
                UserId = userId,
                MachineName = req.MachineName,
                RegisteredAt = now,
            };
            _db.PrintingAgents.Add(agent);
        }

        agent.LastSeen = now;

        _db.AgentPrinters.RemoveRange(agent.Printers);
        agent.Printers = req.Printers.Select(p => new AgentPrinter
        {
            Name = p.Name,
            IsDefault = p.IsDefault,
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { agent.Id });
    }

    // Only returns agents belonging to the authenticated user.
    [HttpGet]
    public async Task<IActionResult> GetAgents()
    {
        var userId = CurrentUserId;
        var cutoff = DateTime.UtcNow.AddMinutes(-2);

        var agents = await _db.PrintingAgents
            .Where(a => a.UserId == userId)
            .Include(a => a.User)
            .Include(a => a.Printers)
            .OrderByDescending(a => a.LastSeen)
            .ToListAsync();

        return Ok(agents.Select(a => new
        {
            a.Id,
            a.MachineName,
            a.LastSeen,
            a.RegisteredAt,
            IsOnline = a.LastSeen >= cutoff,
            User = new { a.User.Email, a.User.DisplayName },
            Printers = a.Printers.OrderByDescending(p => p.IsDefault).Select(p => new { p.Name, p.IsDefault }),
        }));
    }
}

public record HeartbeatPrinter(string Name, bool IsDefault);
public record HeartbeatRequest(string MachineName, List<HeartbeatPrinter> Printers);
