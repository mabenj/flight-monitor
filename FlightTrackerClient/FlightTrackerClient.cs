using DTO;
using System.Net.Http.Json;
using System.Text.Json;

namespace FlightTrackerClient {
    public class FlightTrackerClient(HttpClient httpClient, string baseUrl) {
        public async Task<BoundsDto> GetBounds() {
            var response = await httpClient.GetStringAsync($"{baseUrl}/api/bounds");
            if (response == null) {
                throw new Exception("Failed to retrieve bounds from the server.");
            }
            return JsonSerializer.Deserialize<BoundsDto>(response!)
                ?? throw new Exception("Failed to deserialize bounds");
        }

        public async Task SetActiveFlights(List<FlightDto> flights) {
            var response = await httpClient.PostAsJsonAsync($"{baseUrl}/api/flights/active", flights);
            response.EnsureSuccessStatusCode();
        }

        public async Task<List<FlightDto>> GetActiveFlights() {
            var response = await httpClient.GetStringAsync($"{baseUrl}/api/flights/active");
            if (response == null) {
                throw new Exception("Failed to retrieve bounds from the server.");
            }
            return JsonSerializer.Deserialize<List<FlightDto>>(response!)
                ?? throw new Exception("Failed to deserialize active flights");
        }
    }
}
