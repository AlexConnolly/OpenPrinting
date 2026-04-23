using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace console_api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF NOT EXISTS so this migration is safe to apply against a database that
            // was previously created with EnsureCreated (which leaves no migration history).
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS Users (
                    Id INTEGER NOT NULL CONSTRAINT PK_Users PRIMARY KEY AUTOINCREMENT,
                    Email TEXT NOT NULL,
                    DisplayName TEXT NULL,
                    PasswordHash TEXT NULL,
                    OAuthSubject TEXT NULL,
                    CreatedAt TEXT NOT NULL
                )");

            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Email ON Users (Email)");

            migrationBuilder.CreateTable(
                name: "PrintingAgents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    MachineName = table.Column<string>(type: "TEXT", nullable: false),
                    LastSeen = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrintingAgents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrintingAgents_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgentPrinters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AgentId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentPrinters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgentPrinters_PrintingAgents_AgentId",
                        column: x => x.AgentId,
                        principalTable: "PrintingAgents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgentPrinters_AgentId",
                table: "AgentPrinters",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_PrintingAgents_UserId_MachineName",
                table: "PrintingAgents",
                columns: new[] { "UserId", "MachineName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "AgentPrinters");
            migrationBuilder.DropTable(name: "PrintingAgents");
            migrationBuilder.DropTable(name: "Users");
        }
    }
}
