using DTO;
using System.Data;
using System.Globalization;
using System.Text.Json;

namespace FlightScraper {
    internal class Fr24Client {
        private static readonly string FlightDetailsUrl = "https://data-live.flightradar24.com/clickhandler/?flight=";
        private static readonly string ReatimeFlightsUrl = "https://data-cloud.flightradar24.com/zones/fcgi/feed.js";
        private static readonly Dictionary<string, string> Headers = new() {
            ["accept-encoding"] = "gzip, br",
            ["accept-language"] = "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            ["accept"] = "application/json",
            ["cache-control"] = "max-age=0",
            ["origin"] = "https://www.flightradar24.com",
            ["referer"] = "https://www.flightradar24.com/",
            ["user-agent"] = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        };
        private static readonly Dictionary<string, string> RealtimeFlightParams = new() {
            ["faa"] = "1",
            ["satellite"] = "1",
            ["mlat"] = "1",
            ["flarm"] = "1",
            ["adsb"] = "1",
            ["gnd"] = "1",
            ["air"] = "1",
            ["vehicles"] = "0",
            ["estimated"] = "1",
            ["maxage"] = "14400",
            ["gliders"] = "1",
            ["stats"] = "1",
            ["limit"] = "1500"
        };

        private readonly HttpClient httpClient;

        internal Fr24Client(HttpClient httpClient) {
            this.httpClient = httpClient;
            foreach (var header in Headers) {
                if (this.httpClient.DefaultRequestHeaders.Contains(header.Key)) {
                    continue;
                }
                this.httpClient.DefaultRequestHeaders.Add(header.Key, header.Value);
            }
        }

        public async Task<List<FlightDto>> GetFlightsAsync(BoundsDto bounds) {
            var url = $"{ReatimeFlightsUrl}?bounds={bounds.LatitudeMax.ToString("F2", CultureInfo.InvariantCulture)},{bounds.LatitudeMin.ToString("F2", CultureInfo.InvariantCulture)},{bounds.LongitudeMin.ToString("F2", CultureInfo.InvariantCulture)},{bounds.LongitudeMax.ToString("F2", CultureInfo.InvariantCulture)}";
            foreach (var param in RealtimeFlightParams) {
                url += $"&{param.Key}={param.Value}";
            }

            var response = await httpClient.GetStringAsync(url);
            var data = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(response);
            if (data == null) {
                throw new DataException("Failed to deserialize flight data.");
            }

            var flights = new List<FlightDto>();
            foreach (var kv in data) {
                var key = kv.Key;
                if (key == "full_count" || key == "version" || key == "stats")
                    continue;

                var detailResponse = await httpClient.GetStringAsync($"{FlightDetailsUrl}{key}");
                var flightData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(detailResponse);
                if (flightData == null) {
                    continue;
                }
                flights.Add(ParseFlight(key, flightData));
            }

            return flights;
        }

        private FlightDto ParseFlight(string id, Dictionary<string, JsonElement> flight) {
            var trail = GetNestedArray(flight, "trail").FirstOrDefault() ?? new Dictionary<string, JsonElement>();

            return new FlightDto {
                Id = GetNestedOrDefault(flight, "identification.id", id),
                FlightNumber = GetNested(flight, "identification.number.default"),
                Callsign = GetNested(flight, "identification.callsign"),
                Aircraft = new AircraftDto {
                    ModelCode = GetNested(flight, "aircraft.model.code"),
                    ModelText = GetNested(flight, "aircraft.model.text"),
                    Registration = GetNested(flight, "aircraft.registration")
                },
                Airline = new AirlineDto {
                    Icao = GetNested(flight, "airline.code.icao"),
                    Iata = GetNested(flight, "airline.code.iata"),
                    Name = GetNested(flight, "airline.short") ?? GetNested(flight, "airline.name")
                },
                Metrics = new MetricsDto {
                    Altitude = ToDouble(GetNested(trail, "alt")),
                    GroundSpeed = ToDouble(GetNested(trail, "spd")),
                    Heading = ToDouble(GetNested(trail, "hd"))
                },
                Route = new RouteDto {
                    Origin = new LocationDto {
                        Iata = GetNested(flight, "airport.origin.code.iata"),
                        Icao = GetNested(flight, "airport.origin.code.icao"),
                        Name = GetNested(flight, "airport.origin.name")
                    },
                    Destination = new LocationDto {
                        Iata = GetNested(flight, "airport.destination.code.iata"),
                        Icao = GetNested(flight, "airport.destination.code.icao"),
                        Name = GetNested(flight, "airport.destination.name")
                    }
                },
                Schedule = new ScheduleDto {
                    Departure = new ScheduleTimeDto {
                        Scheduled = ToLong(GetNested(flight, "time.scheduled.departure")),
                        Estimated = ToLong(GetNested(flight, "time.estimated.departure")),
                        Actual = ToLong(GetNested(flight, "time.real.departure")),
                    },
                    Arrival = new ScheduleTimeDto {
                        Scheduled = ToLong(GetNested(flight, "time.scheduled.arrival")),
                        Estimated = ToLong(GetNested(flight, "time.estimated.arrival")),
                        Actual = ToLong(GetNested(flight, "time.real.arrival")),
                    }
                }
            };
        }

        private static long? ToLong(string? input) {
            if (long.TryParse(input, NumberStyles.Any, CultureInfo.InvariantCulture, out var result)) {
                return result;
            }
            return null;
        }

        private static double? ToDouble(string? input) {
            if (double.TryParse(input, NumberStyles.Any, CultureInfo.InvariantCulture, out var result)) {
                return result;
            }
            return null;
        }

        private static string? GetNested(Dictionary<string, JsonElement> data, string path) {
            var parts = path.Split('.');
            JsonElement current = default;

            if (data.TryGetValue(parts[0], out current)) {
                for (int i = 1; i < parts.Length; i++) {
                    if (current.ValueKind == JsonValueKind.Object && current.TryGetProperty(parts[i], out current))
                        continue;
                    return null;
                }
                return current.ToString();
            }
            return null;
        }

        private static string GetNestedOrDefault(Dictionary<string, JsonElement> data, string path, string defaultValue)
            => GetNested(data, path) ?? defaultValue;

        private static List<Dictionary<string, JsonElement>> GetNestedArray(Dictionary<string, JsonElement> data, string path) {
            var value = GetNestedElement(data, path);
            if (value.HasValue && value.Value.ValueKind == JsonValueKind.Array) {
                var list = new List<Dictionary<string, JsonElement>>();
                foreach (var item in value.Value.EnumerateArray()) {
                    var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(item.GetRawText());
                    list.Add(dict);
                }
                return list;
            }
            return new List<Dictionary<string, JsonElement>>();
        }

        private static JsonElement? GetNestedElement(Dictionary<string, JsonElement> data, string path) {
            var parts = path.Split('.');
            JsonElement current = default;

            if (!data.TryGetValue(parts[0], out current))
                return null;

            for (int i = 1; i < parts.Length; i++) {
                if (current.ValueKind == JsonValueKind.Object && current.TryGetProperty(parts[i], out current))
                    continue;
                return null;
            }
            return current;
        }

    }
}
