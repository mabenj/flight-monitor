using Database.Models;
using System.ComponentModel.DataAnnotations;

namespace FlightTrackerAPI.Database.Models {
    internal class ActiveFlight {
        [Key]
        public required string FlightId {
            get; set;
        }

        public Flight? Flight {
            get; set;
        }
    }
}
