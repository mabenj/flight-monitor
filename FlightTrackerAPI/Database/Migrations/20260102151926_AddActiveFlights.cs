using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTrackerAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddActiveFlights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "Timestamp",
                table: "Flights",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "ActiveFlights",
                columns: table => new
                {
                    FlightId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActiveFlights", x => x.FlightId);
                    table.ForeignKey(
                        name: "FK_ActiveFlights_Flights_FlightId",
                        column: x => x.FlightId,
                        principalTable: "Flights",
                        principalColumn: "Id");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActiveFlights");

            migrationBuilder.DropColumn(
                name: "Timestamp",
                table: "Flights");
        }
    }
}
