using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Database.Models {
    [Index(nameof(Registration), IsUnique = true)]
    internal class Aircraft {
        [Key]
        public int Id {
            get; set;
        }

        public string? ModelCode {
            get; set;
        }

        public string? ModelText {
            get; set;
        }

        public required string Registration {
            get; set;
        }

        public ICollection<Flight> Flights { get; set; } = new List<Flight>();
    }
}
