using FlightTrackerClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FlightScraper {
    public class FlightScraperService(IHttpClientFactory httpClientFactory, ILogger<FlightScraperService> logger) : BackgroundService {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken) {
            logger.LogInformation("FlightScraperService started");
            var fr24Client = new Fr24Client(httpClientFactory.CreateClient("Fr24Api"));
            var selfApiClient = new FlightTrackerApiClient(httpClientFactory.CreateClient("SelfApi"));
            while (!stoppingToken.IsCancellationRequested) {
                try {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

                    var bounds = await selfApiClient.GetBoundsAsync();
                    var flights = await fr24Client.GetFlightsAsync(bounds);
                    logger.LogInformation("Fetched {FlightCount} flights within bounds {Bounds}", flights.Count, bounds);
                    await selfApiClient.SetActiveFlightsAsync(flights);
                } catch (OperationCanceledException) {
                    // Normal during shutdown
                } catch (Exception ex) {
                    logger.LogError(ex, "An error occurred in FlightScraperService");
                }
            }
            logger.LogInformation("FlightScraperService stopping");
        }
    }
}
