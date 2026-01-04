using Database;
using Database.Models;
using DTO;
using FlightTrackerAPI.Database.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace FlightTracker.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class FlightsController(AppDbContext dbContext, CancellationToken ct) : ControllerBase {
        [HttpGet]
        public async Task<IEnumerable<FlightDto>> GetAllFlights() {
            var flights = await dbContext.Flights
                .Include(flight => flight.Aircraft)
                .Include(flight => flight.Airline)
                .Include(flight => flight.Origin)
                .Include(flight => flight.Destination)
                .ToListAsync(ct);
            return flights.Select(MapToDto);
        }

        [HttpGet("Active")]
        public async Task<IEnumerable<FlightDto>> GetActiveFlights() {
            var flights = await dbContext.ActiveFlights
                .Include(af => af.Flight)
                .Include(af => af.Flight!.Aircraft)
                .Include(af => af.Flight!.Airline)
                .Include(af => af.Flight!.Origin)
                .Include(af => af.Flight!.Destination)
                .Select(af => af.Flight!)
                .ToListAsync(ct);
            return flights.Select(MapToDto);
        }

        [HttpPost("Active")]
        public async Task SetActiveFlights([FromBody] FlightDto[] activeFlights) {
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
                await transaction.CommitAsync(ct);
            } catch {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }

        private async Task UpsertFlights(FlightDto[] flights) {
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
                    ATA = flight.Schedule?.Arrival?.Actual
                };
                if (flight.Aircraft != null) {
                    var aircraft = await dbContext.Aircrafts
                        .FirstOrDefaultAsync(a => a.Registration == flight.Aircraft!.Registration, ct);
                    if (aircraft != null) {
                        flightEntity.AircraftId = aircraft.Id;
                    }
                }
                if (flight.Airline != null) {
                    var airline = await dbContext.Airlines
                        .FirstOrDefaultAsync(a =>
                            (a.Icao != null && a.Icao == flight.Airline.Icao)
                            || (a.Iata != null && a.Iata == flight.Airline.Iata),
                            ct);
                    if (airline != null) {
                        flightEntity.AirlineId = airline.Id;
                    }
                }
                if (flight.Route?.Origin != null) {
                    var origin = await dbContext.Airports
                        .FirstOrDefaultAsync(a =>
                            (a.Icao != null && a.Icao == flight.Route.Origin.Icao)
                            || (a.Iata != null && a.Iata == flight.Route.Origin.Iata),
                            ct);
                    if (origin != null) {
                        flightEntity.OriginId = origin.Id;
                    }
                }
                if (flight.Route?.Destination != null) {
                    var destination = await dbContext.Airports
                        .FirstOrDefaultAsync(a =>
                            (a.Icao != null && a.Icao == flight.Route.Destination.Icao)
                            || (a.Iata != null && a.Iata == flight.Route.Destination.Iata),
                            ct);
                    if (destination != null) {
                        flightEntity.DestinationId = destination.Id;
                    }
                }
                var existingFlight = await dbContext.Flights
                    .FirstOrDefaultAsync(f => f.Id == flight.Id, ct);
                if (existingFlight != null) {
                    dbContext.Flights.Update(flightEntity);
                } else {
                    dbContext.Flights.Add(flightEntity);
                }
            }
            await dbContext.SaveChangesAsync(ct);
        }

        private async Task UpsertAirports(IEnumerable<LocationDto> airports) {
            foreach (var airport in airports) {
                if (string.IsNullOrWhiteSpace(airport.Icao) && string.IsNullOrWhiteSpace(airport.Iata)) {
                    // No valid identifier
                    continue;
                }
                var existingAirport = await dbContext.Airports
                    .FirstOrDefaultAsync(a =>
                        (a.Icao != null && a.Icao == airport.Icao)
                        || (a.Iata != null && a.Iata == airport.Iata),
                        ct);
                if (existingAirport != null) {
                    dbContext.Airports.Update(new Airport {
                        Id = existingAirport.Id,
                        Icao = airport.Icao ?? existingAirport.Icao,
                        Iata = airport.Iata ?? existingAirport.Iata,
                        Name = airport.Name ?? existingAirport.Name
                    });
                } else {
                    dbContext.Airports.Add(new Airport {
                        Icao = airport.Icao,
                        Iata = airport.Iata,
                        Name = airport.Name
                    });
                }

            }
            await dbContext.SaveChangesAsync(ct);
        }

        private async Task UpsertAircrafts(IEnumerable<AircraftDto> aircrafts) {
            foreach (var aircraft in aircrafts) {
                if (string.IsNullOrWhiteSpace(aircraft.Registration)) {
                    // No valid identifier
                    continue;
                }
                var existingAircraft = await dbContext.Aircrafts
                    .FirstOrDefaultAsync(a => a.Registration == aircraft.Registration, ct);
                if (existingAircraft != null) {
                    dbContext.Aircrafts.Update(new Aircraft {
                        Id = existingAircraft.Id,
                        Registration = existingAircraft.Registration,
                        ModelCode = aircraft.ModelCode ?? existingAircraft.ModelCode,
                        ModelText = aircraft.ModelText ?? existingAircraft.ModelText
                    });
                } else {
                    dbContext.Aircrafts.Add(new Aircraft {
                        Registration = aircraft.Registration!,
                        ModelCode = aircraft.ModelCode,
                        ModelText = aircraft.ModelText
                    });
                }
            }

            await dbContext.SaveChangesAsync(ct);
        }

        private async Task UpsertAirlines(IEnumerable<AirlineDto> airlines) {
            foreach (var airline in airlines) {
                if (string.IsNullOrWhiteSpace(airline.Icao) && string.IsNullOrWhiteSpace(airline.Iata)) {
                    // No valid identifier
                    continue;
                }
                var existingAirline = await dbContext.Airlines
                    .FirstOrDefaultAsync(a =>
                        (a.Icao != null && a.Icao == airline.Icao)
                        || (a.Iata != null && a.Iata == airline.Iata),
                        ct);
                if (existingAirline != null) {
                    dbContext.Airlines.Update(new Airline {
                        Id = existingAirline.Id,
                        Icao = airline.Icao ?? existingAirline.Icao,
                        Iata = airline.Iata ?? existingAirline.Iata,
                        Name = airline.Name ?? existingAirline.Name
                    });
                } else {
                    dbContext.Airlines.Add(new Airline {
                        Icao = airline.Icao,
                        Iata = airline.Iata,
                        Name = airline.Name
                    });
                }
            }

            await dbContext.SaveChangesAsync(ct);
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
