using console_api.Models;
using Microsoft.EntityFrameworkCore;

namespace console_api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<PrintingAgent> PrintingAgents => Set<PrintingAgent>();
    public DbSet<AgentPrinter> AgentPrinters => Set<AgentPrinter>();
    public DbSet<PrintJob> PrintJobs => Set<PrintJob>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<PrintingAgent>()
            .HasIndex(a => new { a.UserId, a.MachineName })
            .IsUnique();

        modelBuilder.Entity<PrintingAgent>()
            .HasMany(a => a.Printers)
            .WithOne()
            .HasForeignKey(p => p.AgentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PrintJob>()
            .HasIndex(j => new { j.AgentId, j.PrinterName, j.Status });

        modelBuilder.Entity<PrintJob>()
            .HasOne(j => j.Agent)
            .WithMany()
            .HasForeignKey(j => j.AgentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
