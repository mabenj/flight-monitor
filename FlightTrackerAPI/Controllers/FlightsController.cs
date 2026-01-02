using DTO;
using Microsoft.AspNetCore.Mvc;

namespace FlightTracker.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class FlightsController : ControllerBase {
        [HttpGet]
        public IEnumerable<FlightDto> GetAllFlights() {
            return [];
        }

        [HttpGet]
        [Route("WithinBounds")]
        public IEnumerable<FlightDto> GetFlightsWithinBounds([FromQuery] int lat_max, [FromQuery] int lat_min, [FromQuery] int lon_max, [FromQuery] int lon_min) {
            return [];
        }

        [HttpPost]
        public void UpdateFlights([FromBody] FlightDto[] flights) {

        }
    }
}
