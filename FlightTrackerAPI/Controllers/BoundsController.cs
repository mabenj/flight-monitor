using DTO;
using Microsoft.AspNetCore.Mvc;

namespace FlightTracker.Controllers {

    [ApiController]
    [Route("/api/[controller]")]
    public class BoundsController : ControllerBase {
        [HttpGet]
        public BoundsDto Get() {
            return new BoundsDto();
        }

        [HttpPost]
        public void Set([FromBody] BoundsDto bounds) {

        }
    }
}
