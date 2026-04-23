using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace console_api.Migrations
{
    /// <inheritdoc />
    public partial class AddPrintJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PrintJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AgentId = table.Column<int>(type: "INTEGER", nullable: false),
                    PrinterName = table.Column<string>(type: "TEXT", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", nullable: false),
                    FileData = table.Column<byte[]>(type: "BLOB", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrintJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrintJobs_PrintingAgents_AgentId",
                        column: x => x.AgentId,
                        principalTable: "PrintingAgents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrintJobs_AgentId_PrinterName_Status",
                table: "PrintJobs",
                columns: new[] { "AgentId", "PrinterName", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrintJobs");
        }
    }
}
