using Database.Models;
using System.ComponentModel.DataAnnotations;

namespace FlightTrackerAPI.Database.Models {
    public class ActiveFlight {
        [Key]
        public required string FlightId {
            get; set;
        }

        public Flight? Flight {
            get; set;
        }
    }
}
