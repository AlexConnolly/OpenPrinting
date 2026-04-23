# OpenPrinting

A self-hosted cloud printing console. Submit print jobs from a browser, have them picked up and printed by a Windows service running on the machine with the printers attached.

## Parts

| Directory | What it is |
|---|---|
| `console-api` | ASP.NET Core 7 Web API — auth, agents, job queue, SQLite database |
| `console-client` | React + Vite + Tailwind frontend — served via nginx in Docker |
| `printing-service` | .NET 7 Windows Worker Service — runs on the print machine, polls for jobs |

## Running the server (Docker)

**Requirements:** Docker with Compose.

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET at minimum
docker compose up -d
```

The console will be available at `http://localhost`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Random string, at minimum 32 characters. Generate with `openssl rand -base64 32` |
| `PUBLIC_URL` | No | The public URL the app is served from. Defaults to `http://localhost` |
| `ALLOW_LOCAL_LOGIN` | No | Set to `true` to allow email/password login. Defaults to `false` |
| `OAUTH_CLIENT_ID` | For SSO | OAuth2 client ID |
| `OAUTH_CLIENT_SECRET` | For SSO | OAuth2 client secret |
| `OAUTH_AUTHORIZATION_URL` | For SSO | Authorization endpoint |
| `OAUTH_TOKEN_URL` | For SSO | Token endpoint |
| `OAUTH_USERINFO_URL` | For SSO | Userinfo endpoint |
| `OAUTH_SCOPES` | No | Defaults to `openid email profile` |

Any standard OIDC provider works (Keycloak, Authentik, Auth0, Google, etc.).

## Running the printing service

**Requirements:** Windows, .NET 7 SDK or runtime.

The printing service runs on the Windows machine that has printers attached. It authenticates with the API, registers its printers, and polls for jobs.

```bash
cd printing-service
dotnet run
```

On first run it will open a browser window to log in. The token is stored locally and reused on subsequent starts.

To configure which server it connects to, edit `appsettings.json`:

```json
{
  "PrintingService": {
    "ServerUrl": "http://your-server"
  }
}
```

### Supported file formats

| Format | Notes |
|---|---|
| PDF | Rendered via embedded PDFium |
| Images | JPG, PNG, BMP, GIF, TIFF — scaled to fit page |
| Plain text | Printed with Courier New via Windows print spooler |
| ZPL | Sent raw to the printer — for label printers |

Office formats (DOCX, XLSX, PPTX) are not supported directly — export to PDF first.

### Installing as a Windows service

```bash
dotnet publish -c Release -o ./publish
sc create OpenPrinting binPath="C:\path\to\publish\printing-service.exe"
sc start OpenPrinting
```

## Running locally (development)

**Requirements:** .NET 7 SDK, Node 18+.

```bash
# API
cd console-api
dotnet run

# Frontend (separate terminal)
cd console-client
npm install
npm run dev
```

The API runs on `http://localhost:5184` and the frontend dev server proxies API requests to it automatically.

First run will create the SQLite database and apply migrations automatically. To create the first user account, visit `http://localhost:5173` — if no users exist the app redirects to a setup page.
