using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Database.Models {

    [Index(nameof(Icao), IsUnique = true)]
    [Index(nameof(Iata), IsUnique = true)]
    internal class Airport {
        [Key]
        public int Id {
            get; set;
        }

        public string? Iata {
            get; set;
        }

        public string? Icao {
            get; set;
        }

        public string? Name {
            get; set;
        }

        public ICollection<Flight> Departures { get; set; } = new List<Flight>();

        public ICollection<Flight> Arrivals { get; set; } = new List<Flight>();
    }
}
