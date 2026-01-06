using DTO;
using System.Net.Http.Json;
using System.Text.Json;

namespace FlightTrackerClient {
    public class FlightTrackerApiClient(HttpClient httpClient) {
        private readonly JsonSerializerOptions serializerOptions = new() { PropertyNameCaseInsensitive = true };

        public async Task<BoundsDto> GetBoundsAsync() {
            var response = await httpClient.GetStringAsync("/api/bounds/active");
            if (response == null) {
                throw new Exception("Failed to retrieve bounds from the server.");
            }
            return JsonSerializer.Deserialize<BoundsDto>(response, serializerOptions)
                ?? throw new Exception("Failed to deserialize bounds");
        }

        public async Task SetActiveFlightsAsync(List<FlightDto> flights) {
            var response = await httpClient.PostAsJsonAsync("/api/flights/active", flights);
            response.EnsureSuccessStatusCode();
        }

        public async Task<List<FlightDto>> GetActiveFlightsAsync() {
            var response = await httpClient.GetStringAsync("/api/flights/active");
            if (response == null) {
                throw new Exception("Failed to retrieve bounds from the server.");
            }
            return JsonSerializer.Deserialize<List<FlightDto>>(response, serializerOptions)
                ?? throw new Exception("Failed to deserialize active flights");
        }
    }
}
