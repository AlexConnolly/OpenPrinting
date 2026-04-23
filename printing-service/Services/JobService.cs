using System.Drawing;
using System.Drawing.Printing;
using System.Net.Http.Json;
using System.Net;
using System.Text.Json;
using PdfiumPrinter;

namespace printing_service.Services;

public class JobService
{
    private readonly AgentService _agent;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<JobService> _logger;

    public JobService(AgentService agent, IHttpClientFactory httpFactory, ILogger<JobService> logger)
    {
        _agent       = agent;
        _httpFactory = httpFactory;
        _logger      = logger;
    }

    public async Task<bool> ProcessNextAsync(string printerName, CancellationToken ct)
    {
        if (_agent.AgentId is not { } agentId) return false;

        var client   = _agent.ApiClient();
        var response = await client.GetAsync(
            $"api/jobs/next?agentId={agentId}&printerName={Uri.EscapeDataString(printerName)}", ct);

        if (response.StatusCode == HttpStatusCode.NoContent) return false;
        response.EnsureSuccessStatusCode();

        var job = await response.Content.ReadFromJsonAsync<JobResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException("Empty job response.");

        _logger.LogInformation("Processing job {Id}: {File} → {Printer}", job.Id, job.FileName, job.PrinterName);

        string? tempFile = null;
        try
        {
            tempFile = job.SourceUrl != null
                ? await DownloadToTempFileAsync(job.FileName, job.SourceUrl, ct)
                : WriteTempFile(job.FileName, job.FileData!);

            await PrintAsync(tempFile, job.PrinterName, ct);

            await client.PostAsync($"api/jobs/{job.Id}/complete", null, ct);
            _logger.LogInformation("Job {Id} completed.", job.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Job {Id} failed.", job.Id);
            var error = JsonContent.Create(new { error = ex.Message });
            await client.PostAsync($"api/jobs/{job.Id}/fail", error, ct);
        }
        finally
        {
            if (tempFile != null) TryDelete(tempFile);
        }

        return true;
    }

    // ── URL download ──────────────────────────────────────────────────────────

    private async Task<string> DownloadToTempFileAsync(string jobFileName, string url, CancellationToken ct)
    {
        _logger.LogInformation("Downloading {Url}", url);

        var http = _httpFactory.CreateClient("download");
        using var resp = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct);
        resp.EnsureSuccessStatusCode();

        var ext = Path.GetExtension(new Uri(url).AbsolutePath);
        if (string.IsNullOrEmpty(ext))
            ext = ExtensionFromContentType(resp.Content.Headers.ContentType?.MediaType);
        if (string.IsNullOrEmpty(ext))
            ext = Path.GetExtension(jobFileName);

        var path = Path.Combine(Path.GetTempPath(), $"openprinting_{Guid.NewGuid()}{ext}");
        await using var file = File.Create(path);
        await resp.Content.CopyToAsync(file, ct);
        return path;
    }

    private static string ExtensionFromContentType(string? mediaType) => mediaType switch
    {
        "application/pdf"        => ".pdf",
        "image/jpeg"             => ".jpg",
        "image/png"              => ".png",
        "image/gif"              => ".gif",
        "image/bmp"              => ".bmp",
        "image/tiff"             => ".tif",
        "image/webp"             => ".webp",
        "text/plain"             => ".txt",
        "application/postscript" => ".ps",
        _                        => "",
    };

    // ── Format dispatch ───────────────────────────────────────────────────────

    private static readonly HashSet<string> ImageExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff" };

    private static readonly HashSet<string> OfficeExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx" };

    private static Task PrintAsync(string filePath, string printerName, CancellationToken ct)
    {
        var data = File.ReadAllBytes(filePath);
        var ext  = Path.GetExtension(filePath);

        if (RawPrinter.IsZpl(filePath, data))
            return Task.Run(() => RawPrinter.Send(printerName, RawPrinter.NormaliseZpl(data)), ct);

        if (ImageExtensions.Contains(ext))
            return Task.Run(() => PrintImage(filePath, printerName), ct);

        if (ext.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
            return Task.Run(() => PrintPdf(filePath, printerName), ct);

        if (ext.Equals(".txt", StringComparison.OrdinalIgnoreCase))
            return Task.Run(() => PrintText(filePath, printerName), ct);

        if (OfficeExtensions.Contains(ext))
            throw new NotSupportedException(
                $"Office documents cannot be printed directly. Export '{Path.GetFileName(filePath)}' to PDF first.");

        throw new NotSupportedException(
            $"Unsupported file type '{ext}'. Supported: PDF, images (JPG/PNG/BMP/GIF/TIFF), plain text, ZPL.");
    }

    // ── PDF via PDFium ────────────────────────────────────────────────────────

    private static void PrintPdf(string filePath, string printerName)
    {
        var printer = new PdfPrinter(printerName);
        printer.Print(filePath);
    }

    // ── Images via System.Drawing ─────────────────────────────────────────────

    private static void PrintImage(string filePath, string printerName)
    {
        using var img = Image.FromFile(filePath);
        using var doc = new PrintDocument();
        doc.PrinterSettings.PrinterName = printerName;
        doc.PrintController = new StandardPrintController();
        doc.PrintPage += (_, e) =>
        {
            var bounds = e.PageBounds;
            var scale  = Math.Min((float)bounds.Width / img.Width, (float)bounds.Height / img.Height);
            var w = (int)(img.Width  * scale);
            var h = (int)(img.Height * scale);
            e.Graphics!.DrawImage(img, (bounds.Width - w) / 2, (bounds.Height - h) / 2, w, h);
        };
        doc.Print();
    }

    // ── Plain text via System.Drawing ─────────────────────────────────────────

    private static void PrintText(string filePath, string printerName)
    {
        var lines       = File.ReadAllLines(filePath);
        var currentLine = 0;

        using var font = new Font("Courier New", 10);
        using var doc  = new PrintDocument();
        doc.PrinterSettings.PrinterName = printerName;
        doc.PrintController = new StandardPrintController();
        doc.PrintPage += (_, e) =>
        {
            var lineHeight   = font.GetHeight(e.Graphics!);
            var linesPerPage = (int)(e.MarginBounds.Height / lineHeight);
            var y = (float)e.MarginBounds.Top;

            for (var i = 0; i < linesPerPage && currentLine < lines.Length; i++, currentLine++)
            {
                e.Graphics!.DrawString(lines[currentLine], font, Brushes.Black, e.MarginBounds.Left, y);
                y += lineHeight;
            }

            e.HasMorePages = currentLine < lines.Length;
        };
        doc.Print();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string WriteTempFile(string fileName, string base64Data)
    {
        var ext  = Path.GetExtension(fileName);
        var path = Path.Combine(Path.GetTempPath(), $"openprinting_{Guid.NewGuid()}{ext}");
        File.WriteAllBytes(path, Convert.FromBase64String(base64Data));
        return path;
    }

    private static void TryDelete(string path)
    {
        try { File.Delete(path); } catch { /* best effort */ }
    }

    private record JobResponse(int Id, string PrinterName, string FileName, string? FileData, string? SourceUrl);
}
