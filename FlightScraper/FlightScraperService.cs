using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FlightScraper {
    public class FlightScraperService(IHttpClientFactory httpClientFactory, ILogger<FlightScraperService> logger) : BackgroundService {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken) {
            logger.LogInformation("FlightScraperService started");
            var fr24Client = httpClientFactory.CreateClient();
            var apiClient = httpClientFactory.CreateClient();
            while (!stoppingToken.IsCancellationRequested) {
                try {
                    logger.LogInformation("Tick at: {Time}", DateTimeOffset.Now);
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
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
