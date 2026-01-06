using Database;
using Database.Models;
using DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Controllers {

    [ApiController]
    [Route("/api/[controller]")]
    public class BoundsController(AppDbContext dbContext) : ControllerBase {

        [HttpGet("Active")]
        public async Task<ActionResult<BoundsDto>> GetActive(CancellationToken ct) {
            var bounds = await dbContext.Bounds.FirstOrDefaultAsync(b => b.IsActive, ct);
            if (bounds == null) {
                return new NotFoundResult();
            }
            return MapToDto(bounds);
        }

        [HttpGet]
        public async Task<ActionResult<List<BoundsDto>>> GetAll(CancellationToken ct) {
            var bounds = await dbContext.Bounds.ToListAsync(ct);
            return bounds.Select(MapToDto).ToList();
        }

        [HttpPost("Active")]
        public async Task<ActionResult> SetActive([FromBody] BoundsDto bounds, CancellationToken ct) {
            if (bounds.LongitudeMax <= bounds.LongitudeMin || bounds.LatitudeMax <= bounds.LatitudeMin) {
                return new BadRequestResult();
            }
            using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
            try {
                var prevActive = await dbContext.Bounds.Where(b => b.IsActive).ToListAsync(ct);
                foreach (var prev in prevActive) {
                    prev.IsActive = false;
                }
                dbContext.Bounds.UpdateRange(prevActive);
                var existingBounds = await dbContext.Bounds
                    .FirstOrDefaultAsync(b => bounds.Id.HasValue && bounds.Id.Value == b.Id, ct);
                if (existingBounds != null) {
                    existingBounds.LongitudeMin = bounds.LongitudeMin;
                    existingBounds.LongitudeMax = bounds.LongitudeMax;
                    existingBounds.LatitudeMax = bounds.LatitudeMax;
                    existingBounds.LatitudeMin = bounds.LatitudeMin;
                    existingBounds.IsActive = true;
                    existingBounds.Timestamp = DateTime.UtcNow;
                } else {
                    dbContext.Bounds.Add(new Bounds {
                        LongitudeMin = bounds.LongitudeMin,
                        LongitudeMax = bounds.LongitudeMax,
                        LatitudeMax = bounds.LatitudeMax,
                        LatitudeMin = bounds.LatitudeMin,
                        IsActive = true,
                        Timestamp = DateTime.UtcNow
                    });
                }
                await dbContext.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                return new OkResult();
            } catch {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }

        private static BoundsDto MapToDto(Bounds bounds) {
            return new BoundsDto {
                LatitudeMax = bounds.LatitudeMax,
                LatitudeMin = bounds.LatitudeMin,
                LongitudeMax = bounds.LongitudeMax,
                LongitudeMin = bounds.LongitudeMin,
                Id = bounds.Id,
                IsActive = bounds.IsActive,
                Timestamp = bounds.Timestamp
            };
        }
    }
}
