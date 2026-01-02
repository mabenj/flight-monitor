using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTrackerAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Flights",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    FlightNumber = table.Column<string>(type: "TEXT", nullable: true),
                    Callsign = table.Column<string>(type: "TEXT", nullable: true),
                    AircraftRegistration = table.Column<string>(type: "TEXT", nullable: true),
                    AirlineIata = table.Column<string>(type: "TEXT", nullable: true),
                    OriginIata = table.Column<string>(type: "TEXT", nullable: true),
                    DestinationIata = table.Column<string>(type: "TEXT", nullable: true),
                    Altitude = table.Column<double>(type: "REAL", nullable: true),
                    GroundSpeed = table.Column<double>(type: "REAL", nullable: true),
                    Heading = table.Column<double>(type: "REAL", nullable: true),
                    STD = table.Column<long>(type: "INTEGER", nullable: true),
                    ETD = table.Column<long>(type: "INTEGER", nullable: true),
                    ATD = table.Column<long>(type: "INTEGER", nullable: true),
                    STA = table.Column<long>(type: "INTEGER", nullable: true),
                    ETA = table.Column<long>(type: "INTEGER", nullable: true),
                    ATA = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Flights", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Flights");
        }
    }
}
