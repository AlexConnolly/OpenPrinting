# OpenPrinting

A self-hosted cloud print console. Submit jobs from anywhere, have them picked up and printed by a lightweight Windows service running on the machine with the printers.

---

## The problem

Most workplaces have printers that are physically tied to a network. If you're not on that network — or you want someone else to be able to print without giving them direct access to the machine — you're stuck. You end up emailing files, using shared drives, remoting into machines, or asking someone to physically print things for you.

OpenPrinting solves this by putting a job queue in the middle. You submit a file (or a URL) through a web console, it lands in the queue for a specific printer, and a small Windows service running on the print machine picks it up and sends it to the printer. Nothing needs to be on the same network. No VPN required.

## Who is it for

- **Small businesses and offices** that want to let staff print remotely without setting up a print server or VPN
- **Warehouses and logistics operations** that need to push ZPL label jobs to thermal printers from a central system
- **IT admins** who want a simple, auditable way to manage print queues across multiple machines without enterprise print server software
- **Developers building products** that need printing — invoices, receipts, labels, reports — without building and maintaining their own print infrastructure. Submit jobs via the API and let OpenPrinting handle delivery to whatever printers your customers have
- **Developers and homelabbers** who want a self-hosted alternative to cloud print services like Google Cloud Print (discontinued) or PrinterLogic

## How it works

```
Browser / API client
      │
      ▼
  console-api          ← ASP.NET Core API, SQLite, runs in Docker
  console-client       ← React frontend, served via nginx in Docker
      │
      │  (polling over HTTPS)
      ▼
  printing-service     ← Windows Worker Service, runs on the print machine
      │
      ▼
  Windows print spooler / raw port
```

1. You log in to the web console and submit a print job — either by uploading a file or providing a URL
2. The job is queued in the API against a specific printer
3. The printing service on the Windows machine polls the API, picks up the next job, and sends it to the printer
4. The job is marked complete and appears in the history

Multiple machines can each run their own printing service, and each registers its own printers. Jobs are scoped to your account — you only see your own printers and queue.

## Supported formats

| Format | How it prints |
|---|---|
| PDF | Rendered via embedded PDFium — no Acrobat required |
| Images (JPG, PNG, BMP, GIF, TIFF) | Scaled to fit the page via Windows GDI |
| Plain text | Printed with Courier New via the Windows print spooler |
| ZPL | Sent raw to the printer — for Zebra and compatible label printers |

Office formats (DOCX, XLSX, PPTX) are not supported directly — export to PDF first.

---

## Setup

### Requirements

- Docker + Compose (for the server)
- A Windows machine with printers attached (for the printing service)
- .NET 7 runtime on that Windows machine

### 1. Configure and start the server

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | At least 32 random characters. Run `openssl rand -base64 32` to generate one |
| `PUBLIC_URL` | No | The URL the console is accessible from. Defaults to `http://localhost` |
| `ALLOW_LOCAL_LOGIN` | No | Set to `true` to enable email/password login |
| `OAUTH_CLIENT_ID` | For SSO | Client ID from your identity provider |
| `OAUTH_CLIENT_SECRET` | For SSO | Client secret |
| `OAUTH_AUTHORIZATION_URL` | For SSO | Authorization endpoint |
| `OAUTH_TOKEN_URL` | For SSO | Token endpoint |
| `OAUTH_USERINFO_URL` | For SSO | Userinfo endpoint |

Any OIDC-compatible provider works — Keycloak, Authentik, Auth0, Google, Azure AD, etc.

```bash
docker compose up -d
```

The console will be at `http://localhost` (or whatever `PUBLIC_URL` is set to). On first visit, you'll be prompted to create an admin account.

### 2. Set up the printing service

On the Windows machine that has the printers:

```bash
cd printing-service
dotnet run
```

On first run it opens a browser to log in to the console. Once authenticated the token is saved locally and reused. The service will register itself and its printers, which will then appear in the console.

To point it at your server, edit `printing-service/appsettings.json`:

```json
{
  "PrintingService": {
    "ServerUrl": "https://your-server"
  }
}
```

#### Installing as a Windows service (optional)

To have it start automatically with Windows:

```bash
dotnet publish -c Release -o ./publish
sc create OpenPrinting binPath="C:\path\to\publish\printing-service.exe"
sc start OpenPrinting
```

---

## Development

```bash
# API — runs on http://localhost:5184
cd console-api
dotnet run

# Frontend — runs on http://localhost:5173, proxies /api to the API
cd console-client
npm install
npm run dev
```

The database is created and migrated automatically on first run.

---

## Repository layout

```
console-api/        ASP.NET Core 7 Web API
  Controllers/      Auth, agents, jobs
  Models/           PrintJob, PrintingAgent, User
  Migrations/       EF Core migrations (SQLite)
  Services/         JWT, OAuth

console-client/     React + Vite + Tailwind frontend
  src/api/          Typed API clients
  src/pages/        Login, dashboard
  src/components/   Shared UI

printing-service/   .NET 7 Windows Worker Service
  Services/         AgentService, JobService, RawPrinter
  Worker.cs         Polling loop
```
