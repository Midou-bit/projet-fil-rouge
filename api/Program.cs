using api.Data;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// --- DB (SQLite : zéro-install, alternative officielle à LocalDB sur Linux/WSL) ---
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=frameforge.db"));

// --- Identity + rôles ---
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(opt =>
    {
        // Politique de mot de passe conforme aux recommandations CNIL : minimum 12 caractères
        // avec les 4 types (minuscule, majuscule, chiffre, caractère spécial). Couplé au
        // verrouillage de compte ci-dessous (anti-bruteforce).
        opt.Password.RequiredLength = 12;
        opt.Password.RequiredUniqueChars = 1;
        opt.Password.RequireDigit = true;
        opt.Password.RequireLowercase = true;
        opt.Password.RequireUppercase = true;
        opt.Password.RequireNonAlphanumeric = true;
        opt.User.RequireUniqueEmail = true;
        // Anti-bruteforce : 5 essais infructueux → verrouillage 5 min (login utilise
        // SignInManager avec lockoutOnFailure: true, cf. AuthController).
        opt.Lockout.MaxFailedAccessAttempts = 5;
        opt.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
        opt.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// --- JWT ---
var jwt = builder.Configuration.GetSection("Jwt");
var signingKey = JwtKeyProvider.Resolve(builder.Configuration, builder.Environment);
builder.Services.AddAuthentication(opt =>
    {
        opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorization();

// Derrière un proxy TLS d'hébergeur (Render/Railway…), respecter X-Forwarded-Proto/For pour que
// la redirection HTTPS ne boucle pas et que les logs voient la vraie IP client.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<ScoringService>();
builder.Services.AddScoped<BuildService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<CatalogImportService>();

// --- CORS pour le front Vite ---
const string CorsPolicy = "frontend";
builder.Services.AddCors(opt =>
    opt.AddPolicy(CorsPolicy, p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "FrameForge API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Coller le token JWT (sans le mot 'Bearer')."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// --- Migrations auto + seed au démarrage (bloquant mais rapide) ---
bool needBackgroundImport;
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(scope.ServiceProvider);
    // On (re)lance l'import en tâche de fond tant que les jeux manquent → robuste si un import
    // précédent a été interrompu (les jeux ne sont pas seedés au démarrage, cf. DbSeeder).
    needBackgroundImport = !await db.Games.AnyAsync();
}

// Imports externes EN ARRIÈRE-PLAN (l'API répond déjà) : le site se lance instantanément,
// les jeux FreeToGame + images se remplissent quelques secondes plus tard.
if (needBackgroundImport)
{
    _ = Task.Run(async () =>
    {
        using var scope = app.Services.CreateScope();
        var sp = scope.ServiceProvider;
        var import = sp.GetRequiredService<CatalogImportService>();
        var db = sp.GetRequiredService<AppDbContext>();

        // Jeux : FreeToGame (vraies miniatures) ; si hors-ligne/échec → fallback curaté offline.
        // (Les composants n'utilisent pas de photo : visuel généré on-brand côté front.)
        if (await import.ImportGamesFromFreeToGameAsync() == 0)
            await DbSeeder.SeedCuratedGamesAsync(db);
    });
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
else
{
    // Production : jamais de stack trace au client, juste un message générique.
    app.UseExceptionHandler(a => a.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "Une erreur interne est survenue." });
    }));
    // HSTS : force le navigateur à n'utiliser que HTTPS (prod uniquement).
    app.UseHsts();
    app.UseHttpsRedirection();
}

// En-têtes HTTP de sécurité sur toutes les réponses (défense en profondeur — C16/C21).
app.Use(async (context, next) =>
{
    var h = context.Response.Headers;
    h["X-Content-Type-Options"] = "nosniff";                 // pas de MIME-sniffing
    h["X-Frame-Options"] = "DENY";                           // anti-clickjacking
    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
    h["X-XSS-Protection"] = "0";                             // désactivé au profit de la CSP (recommandé)
    h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    // CSP : l'API ne sert que du JSON/Swagger → politique verrouillée. Le front (Vite) a sa propre
    // CSP côté hébergeur ; 'unsafe-inline' toléré ici pour l'UI Swagger de dev.
    h["Content-Security-Policy"] =
        "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; " +
        "script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
    await next();
});

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Rend la classe Program accessible à WebApplicationFactory<Program> (api.Tests).
public partial class Program { }
