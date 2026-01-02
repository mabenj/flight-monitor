using FlightTrackerAPI.Database.Models;
using System.ComponentModel.DataAnnotations;

namespace Database.Models {
    internal class Flight {

        [Key]
        public required string Id {
            get; set;
        }

        public string? FlightNumber {
            get; set;
        }

        public string? Callsign {
            get; set;
        }

        public int? AircraftId {
            get; set;
        }

        public Aircraft? Aircraft {
            get; set;
        }

        public int? AirlineId {
            get; set;
        }

        public Airline? Airline {
            get; set;
        }

        public int? OriginId {
            get; set;
        }

        public Airport? Origin {
            get; set;
        }

        public int? DestinationId {
            get; set;
        }

        public Airport? Destination {
            get; set;
        }

        public double? Altitude {
            get; set;
        }

        public double? GroundSpeed {
            get; set;
        }

        public double? Heading {
            get; set;
        }

        public long? STD {
            get; set;
        }

        public long? ETD {
            get; set;
        }

        public long? ATD {
            get; set;
        }

        public long? STA {
            get; set;
        }

        public long? ETA {
            get; set;
        }

        public long? ATA {
            get; set;
        }

        public DateTime Timestamp {
            get; set;
        }

        public ActiveFlight? ActiveFlight {
            get; set;
        }

    }
}
