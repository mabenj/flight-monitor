using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTrackerAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddBoundsIdToFlights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BoundsId",
                table: "Flights",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Flights_BoundsId",
                table: "Flights",
                column: "BoundsId");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Bounds_BoundsId",
                table: "Flights",
                column: "BoundsId",
                principalTable: "Bounds",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Bounds_BoundsId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_BoundsId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "BoundsId",
                table: "Flights");
        }
    }
}
