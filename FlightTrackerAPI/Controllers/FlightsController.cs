using Database;
using Database.Models;
using DTO;
using FlightTrackerAPI.Database.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class FlightsController(AppDbContext dbContext) : ControllerBase {
        [HttpGet]
        public async Task<IEnumerable<FlightDto>> GetAllFlights(CancellationToken ct) {
            var flights = await dbContext.Flights
                .Include(flight => flight.Aircraft)
                .Include(flight => flight.Airline)
                .Include(flight => flight.Origin)
                .Include(flight => flight.Destination)
                .ToListAsync(ct);
            return flights.Select(MapToDto);
        }

        [HttpGet("Active")]
        public async Task<IEnumerable<FlightDto>> GetActiveFlights(CancellationToken ct) {
            var flights = await dbContext.ActiveFlights
                .Include(af => af.Flight)
                .Include(af => af.Flight!.Aircraft)
                .Include(af => af.Flight!.Airline)
                .Include(af => af.Flight!.Origin)
                .Include(af => af.Flight!.Destination)
                .Include(af => af.Flight!.Bounds)
                .Where(af => af.Flight!.Bounds != null && af.Flight.Bounds.IsActive)
                .Select(af => af.Flight!)
                .ToListAsync(ct);
            return flights.Select(MapToDto);
        }

        [HttpPost("Active")]
        public async Task SetActiveFlights([FromBody] FlightDto[] activeFlights, CancellationToken ct) {
            using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
            try {
                await UpsertAirlines(activeFlights.Where(f => f.Airline != null).Select(f => f.Airline!));
                await UpsertAircrafts(activeFlights.Where(f => f.Aircraft != null).Select(f => f.Aircraft!));
                await UpsertAirports(
                    activeFlights
                        .SelectMany(f => new[] { f.Route?.Origin!, f.Route?.Destination! })
                        .Where(loc => loc != null)
                );
                await UpsertFlights(activeFlights);
                await dbContext.ActiveFlights.ExecuteDeleteAsync(ct);
                await dbContext.ActiveFlights.AddRangeAsync(
                    activeFlights
                        .Where(a => !string.IsNullOrWhiteSpace(a.Id))
                        .Select(a => new ActiveFlight { FlightId = a.Id })
                );
                await dbContext.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
            } catch {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }

        private async Task UpsertFlights(FlightDto[] flights) {
            var activeBounds = await dbContext.Bounds.FirstOrDefaultAsync(b => b.IsActive);
            foreach (var flight in flights) {
                if (string.IsNullOrWhiteSpace(flight.Id)) {
                    // No valid identifier
                    continue;
                }
                var flightEntity = new Flight {
                    Id = flight.Id,
                    FlightNumber = flight.FlightNumber,
                    Callsign = flight.Callsign,
                    Altitude = flight.Metrics?.Altitude,
                    GroundSpeed = flight.Metrics?.GroundSpeed,
                    Heading = flight.Metrics?.Heading,
                    STD = flight.Schedule?.Departure?.Scheduled,
                    ETD = flight.Schedule?.Departure?.Estimated,
                    ATD = flight.Schedule?.Departure?.Actual,
                    STA = flight.Schedule?.Arrival?.Scheduled,
                    ETA = flight.Schedule?.Arrival?.Estimated,
                    ATA = flight.Schedule?.Arrival?.Actual,
                    Timestamp = DateTime.UtcNow,
                    BoundsId = activeBounds?.Id
                };
                if (flight.Aircraft != null) {
                    var aircraft = await dbContext.Aircrafts
                        .FirstOrDefaultAsync(a => a.Registration == flight.Aircraft!.Registration);
                    if (aircraft != null) {
                        flightEntity.AircraftId = aircraft.Id;
                    }
                }
                if (flight.Airline != null) {
                    var airline = await dbContext.Airlines
                        .FirstOrDefaultAsync(a =>
                            (a.Icao != null && a.Icao == flight.Airline.Icao)
                            || (a.Iata != null && a.Iata == flight.Airline.Iata));
                    if (airline != null) {
                        flightEntity.AirlineId = airline.Id;
                    }
                }
                if (flight.Route?.Origin != null) {
                    var origin = await dbContext.Airports
                        .FirstOrDefaultAsync(a =>
                            (a.Icao != null && a.Icao == flight.Route.Origin.Icao)
                            || (a.Iata != null && a.Iata == flight.Route.Origin.Iata));
                    if (origin != null) {
                        flightEntity.OriginId = origin.Id;
                    }
                }
                if (flight.Route?.Destination != null) {
                    var destination = await dbContext.Airports
                        .FirstOrDefaultAsync(a =>
                            (a.Icao != null && a.Icao == flight.Route.Destination.Icao)
                            || (a.Iata != null && a.Iata == flight.Route.Destination.Iata));
                    if (destination != null) {
                        flightEntity.DestinationId = destination.Id;
                    }
                }
                var existingFlight = await dbContext.Flights
                    .FirstOrDefaultAsync(f => f.Id == flight.Id);
                if (existingFlight != null) {
                    dbContext.Entry(existingFlight).CurrentValues.SetValues(flightEntity);
                } else {
                    dbContext.Flights.Add(flightEntity);
                }
            }
            await dbContext.SaveChangesAsync();
        }

        private async Task UpsertAirports(IEnumerable<LocationDto> airports) {
            foreach (var airport in airports.DistinctBy(a => a.Icao ?? a.Iata)) {
                if (string.IsNullOrWhiteSpace(airport.Icao) && string.IsNullOrWhiteSpace(airport.Iata)) {
                    // No valid identifier
                    continue;
                }
                var existingAirport = await dbContext.Airports
                    .FirstOrDefaultAsync(a =>
                        (a.Icao != null && a.Icao == airport.Icao)
                        || (a.Iata != null && a.Iata == airport.Iata));
                if (existingAirport != null) {
                    existingAirport.Icao = airport.Icao ?? existingAirport.Icao;
                    existingAirport.Iata = airport.Iata ?? existingAirport.Iata;
                    existingAirport.Name = airport.Name ?? existingAirport.Name;
                    dbContext.Airports.Update(existingAirport);
                } else {
                    dbContext.Airports.Add(new Airport {
                        Icao = airport.Icao,
                        Iata = airport.Iata,
                        Name = airport.Name
                    });
                }

            }
            await dbContext.SaveChangesAsync();
        }

        private async Task UpsertAircrafts(IEnumerable<AircraftDto> aircrafts) {
            foreach (var aircraft in aircrafts) {
                if (string.IsNullOrWhiteSpace(aircraft.Registration)) {
                    // No valid identifier
                    continue;
                }
                var existingAircraft = await dbContext.Aircrafts
                    .FirstOrDefaultAsync(a => a.Registration == aircraft.Registration);
                if (existingAircraft != null) {
                    existingAircraft.ModelCode = aircraft.ModelCode ?? existingAircraft.ModelCode;
                    existingAircraft.ModelText = aircraft.ModelText ?? existingAircraft.ModelText;
                    dbContext.Aircrafts.Update(existingAircraft);
                } else {
                    dbContext.Aircrafts.Add(new Aircraft {
                        Registration = aircraft.Registration!,
                        ModelCode = aircraft.ModelCode,
                        ModelText = aircraft.ModelText
                    });
                }
            }

            await dbContext.SaveChangesAsync();
        }

        private async Task UpsertAirlines(IEnumerable<AirlineDto> airlines) {
            foreach (var airline in airlines.DistinctBy(a => a.Icao ?? a.Iata)) {
                if (string.IsNullOrWhiteSpace(airline.Icao) && string.IsNullOrWhiteSpace(airline.Iata)) {
                    // No valid identifier
                    continue;
                }
                var existingAirline = await dbContext.Airlines
                    .FirstOrDefaultAsync(a =>
                        (a.Icao != null && a.Icao == airline.Icao)
                        || (a.Iata != null && a.Iata == airline.Iata));
                if (existingAirline != null) {
                    existingAirline.Icao = airline.Icao ?? existingAirline.Icao;
                    existingAirline.Iata = airline.Iata ?? existingAirline.Iata;
                    existingAirline.Name = airline.Name ?? existingAirline.Name;
                    dbContext.Airlines.Update(existingAirline);
                } else {
                    dbContext.Airlines.Add(new Airline {
                        Icao = airline.Icao,
                        Iata = airline.Iata,
                        Name = airline.Name
                    });
                }
            }

            await dbContext.SaveChangesAsync();
        }

        private static FlightDto MapToDto(Flight flight) {
            return new FlightDto {
                Id = flight.Id,
                FlightNumber = flight.FlightNumber,
                Callsign = flight.Callsign,
                Aircraft = flight.Aircraft == null ? null : new AircraftDto {
                    Registration = flight.Aircraft.Registration,
                    ModelCode = flight.Aircraft.ModelCode,
                    ModelText = flight.Aircraft.ModelText,
                },
                Airline = flight.Airline == null ? null : new AirlineDto {
                    Iata = flight.Airline.Iata,
                    Icao = flight.Airline.Icao,
                    Name = flight.Airline.Name,
                },
                Metrics = new MetricsDto {
                    Altitude = flight.Altitude,
                    GroundSpeed = flight.GroundSpeed,
                    Heading = flight.Heading
                },
                Route = new RouteDto {
                    Origin = new LocationDto {
                        Icao = flight.Origin?.Icao,
                        Iata = flight.Origin?.Iata,
                        Name = flight.Origin?.Name
                    },
                    Destination = new LocationDto {
                        Icao = flight.Destination?.Icao,
                        Iata = flight.Destination?.Iata,
                        Name = flight.Destination?.Name
                    }
                },
                Schedule = new ScheduleDto {
                    Departure = new ScheduleTimeDto {
                        Scheduled = flight.STD,
                        Estimated = flight.ETD,
                        Actual = flight.ATD
                    },
                    Arrival = new ScheduleTimeDto {
                        Scheduled = flight.STA,
                        Estimated = flight.ETA,
                        Actual = flight.ATA
                    }
                }
            };
        }
    }
}
