using System.ComponentModel.DataAnnotations;

namespace DTO {
    public class FlightDto {
        public required string Id {
            get; set;
        }

        public string? FlightNumber {
            get; set;
        }
        public string? Callsign {
            get; set;
        }

        public AircraftDto? Aircraft {
            get; set;
        }
        public AirlineDto? Airline {
            get; set;
        }
        public MetricsDto? Metrics {
            get; set;
        }
        public RouteDto? Route {
            get; set;
        }
        public ScheduleDto? Schedule {
            get; set;
        }

        public DateTime? LastUpdate {
            get; set;
        }
    }

    public class AircraftDto {
        public string? ModelCode {
            get; set;
        }
        public string? ModelText {
            get; set;
        }
        public string? Registration {
            get; set;
        }
    }

    public class AirlineDto {
        public string? Icao {
            get; set;
        }
        public string? Iata {
            get; set;
        }
        public string? Name {
            get; set;
        }
    }

    public class MetricsDto {
        public double? Altitude {
            get; set;
        }
        public double? GroundSpeed {
            get; set;
        }
        public double? Heading {
            get; set;
        }
    }

    public class RouteDto {
        public LocationDto? Origin {
            get; set;
        }
        public LocationDto? Destination {
            get; set;
        }
    }

    public class LocationDto {
        public string? Iata {
            get; set;
        }
        public string? Icao {
            get; set;
        }
        public string? Name {
            get; set;
        }
    }

    public class ScheduleDto {
        public ScheduleTimeDto? Departure {
            get; set;
        }
        public ScheduleTimeDto? Arrival {
            get; set;
        }
    }

    public class ScheduleTimeDto {
        public long? Scheduled {
            get; set;
        }
        public long? Estimated {
            get; set;
        }
        public long? Actual {
            get; set;
        }
    }
}
