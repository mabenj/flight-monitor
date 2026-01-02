using Database.Models;
using FlightTrackerAPI.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Database {
    public class AppDbContext : DbContext {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Flight> Flights => Set<Flight>();

        public DbSet<Aircraft> Aircrafts => Set<Aircraft>();

        public DbSet<Airline> Airlines => Set<Airline>();

        public DbSet<Airport> Airports => Set<Airport>();

        public DbSet<ActiveFlight> ActiveFlights => Set<ActiveFlight>();

        public DbSet<Bounds> Bounds => Set<Bounds>();

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            base.OnModelCreating(modelBuilder);

            // Flight -> Origin (one-to-many)
            modelBuilder.Entity<Flight>()
                .HasOne(f => f.Origin)
                .WithMany(o => o.Departures)
                .HasForeignKey(f => f.OriginId)
                .HasPrincipalKey(o => o.Id);

            // Flight -> Destination (one-to-many)
            modelBuilder.Entity<Flight>()
                .HasOne(f => f.Destination)
                .WithMany(d => d.Arrivals)
                .HasForeignKey(f => f.DestinationId)
                .HasPrincipalKey(d => d.Id);

            // Flight -> ActiveFlight (one-to-one)
            modelBuilder.Entity<Flight>()
                .HasOne(f => f.ActiveFlight)
                .WithOne(a => a.Flight)
                .HasForeignKey<ActiveFlight>(a => a.FlightId)
                .IsRequired(false);
        }

    }
}
