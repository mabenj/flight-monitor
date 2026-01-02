using Database;
using Database.Models;
using DTO;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Controllers {

    [ApiController]
    [Route("/api/[controller]")]
    public class BoundsController(AppDbContext dbContext) : ControllerBase {

        [HttpGet]
        public async Task<ActionResult<BoundsDto>> Get(CancellationToken ct) {
            var bounds = await dbContext.Bounds.FirstOrDefaultAsync(ct);
            if (bounds == null) {
                return new NotFoundResult();
            }
            return new BoundsDto {
                LatitudeMax = bounds.LatitudeMax,
                LatitudeMin = bounds.LatitudeMin,
                LongitudeMax = bounds.LongitudeMax,
                LongitudeMin = bounds.LongitudeMin
            };
        }

        [HttpPost]
        public async Task<ActionResult> Set([FromBody] BoundsDto bounds, CancellationToken ct) {
            if (bounds.LongitudeMax <= bounds.LongitudeMin || bounds.LatitudeMax <= bounds.LatitudeMin) {
                return new BadRequestResult();
            }
            var existingBounds = await dbContext.Bounds.FirstOrDefaultAsync(ct);
            if (existingBounds == null) {
                dbContext.Bounds.Add(new Bounds {
                    LatitudeMax = bounds.LatitudeMax,
                    LatitudeMin = bounds.LatitudeMin,
                    LongitudeMax = bounds.LongitudeMax,
                    LongitudeMin = bounds.LongitudeMin
                });
            } else {
                existingBounds.LatitudeMax = bounds.LatitudeMax;
                existingBounds.LatitudeMin = bounds.LatitudeMin;
                existingBounds.LongitudeMax = bounds.LongitudeMax;
                existingBounds.LongitudeMin = bounds.LongitudeMin;
                dbContext.Bounds.Update(existingBounds);
            }
            await dbContext.SaveChangesAsync(ct);
            return new OkResult();
        }
    }
}
