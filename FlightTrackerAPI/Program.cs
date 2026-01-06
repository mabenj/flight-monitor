using Database;
using FlightScraper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options => {
    var appDataDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "FlightTracker"
    );
    Directory.CreateDirectory(appDataDir);
    options.UseSqlite($"Data Source={Path.Combine(appDataDir, "appdata.db")}");
});

// Add services to the container.

builder.Services.AddControllers();
builder.Services
    .AddHttpClient("Fr24Api")
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler() { AutomaticDecompression = DecompressionMethods.All });
builder.Services
    .AddHttpClient("SelfApi", client => {
        var baseUrl = builder.Configuration["SelfApiBaseUrl"] ?? "https://localhost:5001";
        client.BaseAddress = new Uri(baseUrl);
    })
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler() { AutomaticDecompression = DecompressionMethods.All });
builder.Services.AddHostedService<FlightScraperService>();

var app = builder.Build();

// Apply migrations / create DB on startup
using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.

app.UseAuthorization();

app.MapControllers();

app.Run();
