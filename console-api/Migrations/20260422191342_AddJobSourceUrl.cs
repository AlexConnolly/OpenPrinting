using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace console_api.Migrations
{
    /// <inheritdoc />
    public partial class AddJobSourceUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SourceUrl",
                table: "PrintJobs",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SourceUrl",
                table: "PrintJobs");
        }
    }
}
