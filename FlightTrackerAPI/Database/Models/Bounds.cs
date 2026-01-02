using System.ComponentModel.DataAnnotations;

namespace Database.Models {
    public class Bounds {
        [Key]
        public int Id {
            get; set;
        }

        public double LongitudeMax {
            get; set;
        }

        public double LongitudeMin {
            get; set;
        }

        public double LatitudeMax {
            get; set;
        }

        public double LatitudeMin {
            get; set;
        }
    }
}
