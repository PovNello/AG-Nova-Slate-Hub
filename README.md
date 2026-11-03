# AG Nova Slate Hub

> **NASA-punk e-ink dashboard for Kindle Paperwhite 11 with modular slot administration.**  
> Zero framework dependencies. Zero build pipelines. Deploys natively to Vercel Serverless.

[![Runtime](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-Vercel%20Serverless-black.svg)](https://vercel.com)
[![Storage](https://img.shields.io/badge/Database-Upstash%20Redis-red.svg)](https://upstash.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

---

## Overview

**AG Nova Slate Hub** (`ag-nova-slate-hub`) transforms an idle Kindle Paperwhite 11 (or compatible e-reader) into a permanent, high-contrast, landscape status terminal. It includes a browser-based, NASA-punk styled administration interface to configure layouts, weather locations, timezones, and report messages in real time.

```
       +------------------------------------+
       |  AG NOVA SLATE HUB // N.O.V.A. OS  |
       +------------------------------------+
       | [CHR] CHRONOMETER  | [ATM] WEATHER |
       |                    | 18° Overcast  |
       |     11 : 42        | Min 12° / 21° |
       |                    | Wind 14 km/h  |
       +--------------------+---------------+
       | [NVA] "Terminal operational.       |
       |        No anomalies detected."     |
       +------------------------------------+
       | LINK ACTIVE * SYNC 11:42           |
       +------------------------------------+
```

For technical deep dives into data flow, Redis schema, and security architecture, see [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md).  
For release history, see [CHANGELOG.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/CHANGELOG.md).  
For AI agent context and coding invariants, see [AGENTS.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/AGENTS.md), [CLAUDE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/CLAUDE.md), and [GEMINI.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/GEMINI.md).

---

## Key Features

- **Zero-Build Architecture**: Pure Node.js ES Modules on the backend (`api/` and `lib/`) and vanilla HTML/CSS/JS on the frontend (`public/`).
- **Kindle WebKit Compatibility**: High-contrast, monochrome CSS with `-webkit-` vendor prefixes and inline ES5 scripts for smooth 1-minute clock updates without e-ink flashing.
- **Weighted Row Layout Engine**: Portrait uses 3 stacked rows; Landscape uses a 3 rows x 2 columns grid. Each row has a height weight, and in landscape each row has its own column split. A single filled column auto-expands to the full row width. Modules available per slot:
  - `clock`: High-visibility time, stardate, day/month, and timezone.
  - `weather`: Real-time weather, min/max, humidity, wind, and forecast tables via Open-Meteo (no API key required).
  - `report`: Dynamic NASA-punk logs or custom status notes.
  - `none`: Empty slots for asymmetrical compositions.
- **Secure Administration Panel**: Accessible at `/admin`, protected by an 8+ character PIN, HMAC-signed session cookies, and IP rate limiting (5 attempts per 15 min).
- **Automated Database Keepalive**: Built-in Vercel cron handler (`/api/keepalive`) runs daily to prevent Upstash Redis free-tier instances from becoming inactive.

---

## Directory Layout

```
api/            # Vercel serverless endpoints
  dashboard.js  # HTML view for Kindle, reached via /dashboard?k=TOKEN
  login.js      # PIN authentication + IP rate limiting
  logout.js     # Session revocation
  config.js     # GET / PUT configuration (authenticated)
  preview.js    # Live draft preview rendering (authenticated)
  keepalive.js  # Scheduled cron keepalive against Upstash archiving
lib/            # Shared business logic (render, weather, redis, security)
public/         # Static assets (admin.html, index.html)
vercel.json     # Routing rewrites, security headers, and cron schedules
```

---

## Quickstart & Deployment

### 1. Deploy to Vercel
1. Push this repository to GitHub (`ag-nova-slate-hub`).
2. Import the project into [Vercel](https://vercel.com).
   - **Framework Preset**: `Other`
   - **Build Command**: *(leave empty)*
   - **Output Directory**: `public` (defined in `vercel.json`)

### 2. Connect Upstash Redis
1. In your Vercel Project Dashboard, navigate to **Storage > Marketplace > Upstash Redis** (free tier).
2. Connect it to your project. Vercel automatically injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### 3. Configure Environment Variables
In your Vercel Project Settings (**Settings > Environment Variables**), set the following:

| Variable | Requirement | Description / How to Generate |
| :--- | :--- | :--- |
| `ADMIN_PIN` | Minimum 8 chars | Master password used to log in at `/admin`. |
| `SESSION_SECRET` | 64 hex chars | HMAC signing key: `openssl rand -hex 32` |
| `DASHBOARD_TOKEN` | 32 hex chars | Secret token appended to Kindle URL: `openssl rand -hex 16` |
| `CRON_SECRET` | 32 hex chars | Bearer token for Vercel cron: `openssl rand -hex 16` |

Redeploy the project once the variables are saved.

---

## Setup Your Kindle Paperwhite

1. Open `/admin` on your computer or smartphone, authenticate with your `ADMIN_PIN`, configure your layout, and click **COMMIT CONFIG**.
2. Click **COPY** on the **TERMINAL LINK** section (e.g. `https://your-domain.vercel.app/dashboard?k=<DASHBOARD_TOKEN>`).
3. On your Kindle Paperwhite:
   - Open the **Experimental Browser** (`Menu &rarr; Experimental Browser`).
   - Navigate to the copied URL.
   - Bookmark the page for immediate one-tap access.
   - Choose **PORTRAIT** or **LANDSCAPE** in `/admin`. Landscape is rendered rotated in software (90°), so keep the Kindle browser in its normal upright mode and turn the device sideways.
   - Use **FLIP SCREEN (180°)** to match how the device is mounted: portrait 0° / 180°, landscape 90° / 270°.

---

## Operational Notes

- **Initial State**: Before saving a configuration in `/admin` for the first time, the dashboard displays default fallback metrics.
- **Clock Synchronization**: The minute ticker runs client-side via ES5 JavaScript, synchronized against the server offset. Full page refreshes occur every `N` minutes (default 15) via `<meta http-equiv="refresh">`.
- **Scheduled Cron**: The keepalive cron job triggers automatically in production once daily between 04:00 and 04:59 UTC (standard Vercel Hobby plan constraint).

---

## License

MIT © AG Nova Slate Hub Contributors
