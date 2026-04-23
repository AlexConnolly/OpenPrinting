using System.Security.Claims;
using console_api.Data;
using console_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace console_api.Controllers;

[ApiController]
[Route("jobs")]
[Authorize]
public class JobsController : ControllerBase
{
    private readonly AppDbContext _db;

    public JobsController(AppDbContext db) => _db = db;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Accepts either a file upload OR a source URL — not both, not neither.
    [HttpPost]
    [RequestSizeLimit(52_428_800)] // 50 MB cap for file uploads
    public async Task<IActionResult> Submit([FromForm] SubmitJobForm form)
    {
        var hasFile = form.File is { Length: > 0 };
        var hasUrl  = !string.IsNullOrWhiteSpace(form.SourceUrl);

        if (!hasFile && !hasUrl)
            return BadRequest(new { error = "Provide either a file or a source URL." });
        if (hasFile && hasUrl)
            return BadRequest(new { error = "Provide a file or a URL, not both." });

        var agent = await _db.PrintingAgents
            .FirstOrDefaultAsync(a => a.Id == form.AgentId && a.UserId == CurrentUserId);

        if (agent == null)
            return NotFound(new { error = "Agent not found." });

        PrintJob job;

        if (hasUrl)
        {
            if (!Uri.TryCreate(form.SourceUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "http" && uri.Scheme != "https"))
                return BadRequest(new { error = "Source URL must be an absolute http/https URL." });

            var fileName = Path.GetFileName(uri.AbsolutePath);
            if (string.IsNullOrEmpty(fileName)) fileName = "document";

            job = new PrintJob
            {
                AgentId    = form.AgentId,
                PrinterName = form.PrinterName,
                FileName   = fileName,
                FileData   = Array.Empty<byte>(),
                SourceUrl  = form.SourceUrl!.Trim(),
                Status     = JobStatus.Pending,
                CreatedAt  = DateTime.UtcNow,
            };
        }
        else
        {
            using var ms = new MemoryStream();
            await form.File!.CopyToAsync(ms);

            job = new PrintJob
            {
                AgentId     = form.AgentId,
                PrinterName = form.PrinterName,
                FileName    = form.File.FileName,
                FileData    = ms.ToArray(),
                Status      = JobStatus.Pending,
                CreatedAt   = DateTime.UtcNow,
            };
        }

        _db.PrintJobs.Add(job);
        await _db.SaveChangesAsync();
        return Ok(Summarise(job));
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? agentId)
    {
        var userId = CurrentUserId;
        var query  = _db.PrintJobs.Where(j => j.Agent.UserId == userId);

        if (agentId.HasValue)
            query = query.Where(j => j.AgentId == agentId.Value);

        var jobs = await query
            .OrderByDescending(j => j.CreatedAt)
            .Take(200)
            .Select(j => new
            {
                j.Id, j.AgentId, j.PrinterName, j.FileName, j.SourceUrl,
                j.Status, j.ErrorMessage, j.CreatedAt, j.StartedAt, j.CompletedAt,
            })
            .ToListAsync();

        return Ok(jobs);
    }

    [HttpGet("next")]
    public async Task<IActionResult> Next([FromQuery] int agentId, [FromQuery] string printerName)
    {
        var userId = CurrentUserId;

        var agentBelongsToUser = await _db.PrintingAgents
            .AnyAsync(a => a.Id == agentId && a.UserId == userId);

        if (!agentBelongsToUser) return Forbid();

        var job = await _db.PrintJobs
            .Where(j => j.AgentId == agentId && j.PrinterName == printerName && j.Status == JobStatus.Pending)
            .OrderBy(j => j.CreatedAt)
            .FirstOrDefaultAsync();

        if (job == null) return NoContent();

        job.Status    = JobStatus.Printing;
        job.StartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            job.Id,
            job.PrinterName,
            job.FileName,
            job.SourceUrl,
            // Only send file data for uploaded jobs — URL jobs download direct
            FileData = job.SourceUrl == null ? Convert.ToBase64String(job.FileData) : null,
        });
    }

    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var job = await _db.PrintJobs.Include(j => j.Agent).FirstOrDefaultAsync(j => j.Id == id);
        if (job == null) return NotFound();
        if (job.Agent.UserId != CurrentUserId) return Forbid();

        job.Status      = JobStatus.Completed;
        job.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id:int}/fail")]
    public async Task<IActionResult> Fail(int id, [FromBody] FailJobRequest req)
    {
        var job = await _db.PrintJobs.Include(j => j.Agent).FirstOrDefaultAsync(j => j.Id == id);
        if (job == null) return NotFound();
        if (job.Agent.UserId != CurrentUserId) return Forbid();

        job.Status       = JobStatus.Failed;
        job.CompletedAt  = DateTime.UtcNow;
        job.ErrorMessage = req.Error;
        await _db.SaveChangesAsync();
        return Ok();
    }

    private static object Summarise(PrintJob j) => new
    {
        j.Id, j.AgentId, j.PrinterName, j.FileName, j.SourceUrl, j.Status, j.CreatedAt,
    };
}

public class SubmitJobForm
{
    public int AgentId { get; set; }
    public string PrinterName { get; set; } = "";
    public IFormFile? File { get; set; }
    public string? SourceUrl { get; set; }
}

public record FailJobRequest(string Error);
