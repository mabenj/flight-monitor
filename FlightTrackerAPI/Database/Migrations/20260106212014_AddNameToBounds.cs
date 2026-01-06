using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTrackerAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddNameToBounds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Bounds",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "Bounds");
        }
    }
}
