using System;
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
                name: "Aircrafts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ModelCode = table.Column<string>(type: "TEXT", nullable: true),
                    ModelText = table.Column<string>(type: "TEXT", nullable: true),
                    Registration = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aircrafts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Airlines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Icao = table.Column<string>(type: "TEXT", nullable: true),
                    Iata = table.Column<string>(type: "TEXT", nullable: true),
                    Name = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Airlines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Airports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Iata = table.Column<string>(type: "TEXT", nullable: true),
                    Icao = table.Column<string>(type: "TEXT", nullable: true),
                    Name = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Airports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Bounds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    LongitudeMax = table.Column<double>(type: "REAL", nullable: false),
                    LongitudeMin = table.Column<double>(type: "REAL", nullable: false),
                    LatitudeMax = table.Column<double>(type: "REAL", nullable: false),
                    LatitudeMin = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bounds", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Flights",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    FlightNumber = table.Column<string>(type: "TEXT", nullable: true),
                    Callsign = table.Column<string>(type: "TEXT", nullable: true),
                    AircraftId = table.Column<int>(type: "INTEGER", nullable: true),
                    AirlineId = table.Column<int>(type: "INTEGER", nullable: true),
                    OriginId = table.Column<int>(type: "INTEGER", nullable: true),
                    DestinationId = table.Column<int>(type: "INTEGER", nullable: true),
                    Altitude = table.Column<double>(type: "REAL", nullable: true),
                    GroundSpeed = table.Column<double>(type: "REAL", nullable: true),
                    Heading = table.Column<double>(type: "REAL", nullable: true),
                    STD = table.Column<long>(type: "INTEGER", nullable: true),
                    ETD = table.Column<long>(type: "INTEGER", nullable: true),
                    ATD = table.Column<long>(type: "INTEGER", nullable: true),
                    STA = table.Column<long>(type: "INTEGER", nullable: true),
                    ETA = table.Column<long>(type: "INTEGER", nullable: true),
                    ATA = table.Column<long>(type: "INTEGER", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Flights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Flights_Aircrafts_AircraftId",
                        column: x => x.AircraftId,
                        principalTable: "Aircrafts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Flights_Airlines_AirlineId",
                        column: x => x.AirlineId,
                        principalTable: "Airlines",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Flights_Airports_DestinationId",
                        column: x => x.DestinationId,
                        principalTable: "Airports",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Flights_Airports_OriginId",
                        column: x => x.OriginId,
                        principalTable: "Airports",
                        principalColumn: "Id");
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_Aircrafts_Registration",
                table: "Aircrafts",
                column: "Registration",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Airlines_Iata",
                table: "Airlines",
                column: "Iata",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Airlines_Icao",
                table: "Airlines",
                column: "Icao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Airports_Iata",
                table: "Airports",
                column: "Iata",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Airports_Icao",
                table: "Airports",
                column: "Icao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Flights_AircraftId",
                table: "Flights",
                column: "AircraftId");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_AirlineId",
                table: "Flights",
                column: "AirlineId");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_DestinationId",
                table: "Flights",
                column: "DestinationId");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_OriginId",
                table: "Flights",
                column: "OriginId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActiveFlights");

            migrationBuilder.DropTable(
                name: "Bounds");

            migrationBuilder.DropTable(
                name: "Flights");

            migrationBuilder.DropTable(
                name: "Aircrafts");

            migrationBuilder.DropTable(
                name: "Airlines");

            migrationBuilder.DropTable(
                name: "Airports");
        }
    }
}
