using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightTrackerAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AircraftRegistration",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "AirlineIata",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "DestinationIata",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "OriginIata",
                table: "Flights");

            migrationBuilder.AddColumn<int>(
                name: "AircraftId",
                table: "Flights",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AirlineId",
                table: "Flights",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DestinationId",
                table: "Flights",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OriginId",
                table: "Flights",
                type: "INTEGER",
                nullable: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Aircrafts_AircraftId",
                table: "Flights",
                column: "AircraftId",
                principalTable: "Aircrafts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airlines_AirlineId",
                table: "Flights",
                column: "AirlineId",
                principalTable: "Airlines",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airports_DestinationId",
                table: "Flights",
                column: "DestinationId",
                principalTable: "Airports",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airports_OriginId",
                table: "Flights",
                column: "OriginId",
                principalTable: "Airports",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Aircrafts_AircraftId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airlines_AirlineId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airports_DestinationId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airports_OriginId",
                table: "Flights");

            migrationBuilder.DropTable(
                name: "Aircrafts");

            migrationBuilder.DropTable(
                name: "Airlines");

            migrationBuilder.DropTable(
                name: "Airports");

            migrationBuilder.DropIndex(
                name: "IX_Flights_AircraftId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_AirlineId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_DestinationId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_OriginId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "AircraftId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "AirlineId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "DestinationId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "OriginId",
                table: "Flights");

            migrationBuilder.AddColumn<string>(
                name: "AircraftRegistration",
                table: "Flights",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AirlineIata",
                table: "Flights",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DestinationIata",
                table: "Flights",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginIata",
                table: "Flights",
                type: "TEXT",
                nullable: true);
        }
    }
}
