using System.Text;
using console_api.Data;
using console_api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=openprinting.db"));

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<OAuthService>(sp => new OAuthService(
    sp.GetRequiredService<IHttpClientFactory>().CreateClient(),
    sp.GetRequiredService<Microsoft.Extensions.Caching.Memory.IMemoryCache>(),
    sp.GetRequiredService<IConfiguration>()));

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        };
    });

builder.Services.AddAuthorization();

var frontendUrl = builder.Configuration["App:FrontendUrl"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendUrl).AllowAnyHeader().AllowAnyMethod()));

builder.WebHost.ConfigureKestrel(k => k.Limits.MaxRequestBodySize = 55 * 1024 * 1024); // 55 MB

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.UseCors();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
