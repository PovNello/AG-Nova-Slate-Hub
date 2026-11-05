# GEMINI.md: AG Nova Slate Hub

Context, engineering standards, and operational guidelines for Google Gemini agents working on **AG Nova Slate Hub** (`ag-nova-slate-hub`).

For technical architecture and diagrams, see [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md).  
For operator setup and environment guide, see [README.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/README.md).  
For Claude agent instructions, see [CLAUDE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/CLAUDE.md).

---

## 1. Prime Directives for Gemini

### 1. English Exclusivity
- **Every piece of code, comment, commit message, documentation, error response, and UI element MUST be in English.**
- Do NOT generate or introduce Italian strings or comments under any circumstances.
- Sci-fi / NASA-punk lore strings in `lib/config.js` or `public/admin.html` must remain in atmospheric English.

### 2. Zero-Build & Minimal Footprint
- Never install frontend UI frameworks (React, Vue, Svelte), CSS processors (Tailwind, PostCSS), or bundlers (Vite, Webpack, esbuild).
- Never add npm dependencies beyond `@upstash/redis`.
- The codebase relies entirely on native Node.js ES Modules (`import`/`export`) and vanilla web standards.

### 3. E-Ink / Kindle Paperwhite 11 Compatibility
- The Kindle Experimental Browser has limited memory and a legacy WebKit rendering engine.
- **Client scripts embedded in the dashboard HTML (`lib/render.js`) MUST use strict ES5 syntax.**
  - Do NOT use `const`, `let`, arrow functions, promises, `async/await`, or template literals in the Kindle client script.
  - Stick to `var`, standard `function`, and basic DOM manipulation.
- Dashboard styling must remain high-contrast monochrome (`#000` text on `#fff` background). No CSS transitions, blurs, box-shadows, or heavy animations on the Kindle interface.
- Maintain `-webkit-` vendor prefixes in dashboard CSS for transformations and flexbox support.

### 4. Security Invariants
- **Constant-Time Verification**: Always use `safeEqual` from `lib/security.js` when verifying `DASHBOARD_TOKEN`, `ADMIN_PIN`, or session cookies to prevent timing attacks.
- **Session Protection**: Ensure the `nova_admin` cookie keeps `HttpOnly; Secure; SameSite=Strict`.
- **IP Rate Limiting**: All login attempts must be incremented in Redis before PIN evaluation.

### 5. Mandatory Changelog & Documentation Updates
- **EVERY action, code modification, feature addition, bug fix, or refactor MUST result in an update to `CHANGELOG.md`.**
- If an action modifies architectural behavior, slot logic, layout mechanics, endpoints, or configuration, the agent MUST immediately update or create relevant documentation (e.g. `ARCHITECTURE.md`, `README.md`).
- Never complete a task or user turn without ensuring `CHANGELOG.md` reflects all changes made.

### 6. Visual System (Admin & Landing)
- `public/css/01-tokens.css` to `06-responsive.css` are vendored copies of the AG Nova visual framework. **Never edit them**; replace a file as a whole when the framework is updated.
- Slate Hub specific components live only in `public/css/08-slatehub.css`, use the `hub-` prefix, and are built exclusively from `var(--...)` tokens. No hard-coded colours or font stacks in `08-slatehub.css` or inline styles (the `theme-color` meta tag is the only exception), and spacing comes from the `--sp-*` scale wherever one exists.
- Colours are semantic: cyan = live / operational, orange = in progress or warning, ivory = knowledge and N.O.V.A. voice, danger = genuine failure only.
- Fonts (Space Grotesk, Inter Tight, IBM Plex Mono) are self-hosted in `public/fonts/` and declared in `public/css/00-fonts.css`. Do not add third-party font CDNs.
- The Kindle dashboard (`lib/render.js`) is exempt from the colour system: it stays monochrome `#000` / `#fff`. Only its font family follows the brand (IBM Plex Mono, with Courier New as fallback).

---

## 2. Architecture & File Reference

```
ag-nova-slate-hub/
├── api/                  # Vercel serverless HTTP endpoints
│   ├── config.js         # GET / PUT terminal configuration
│   ├── dashboard.js      # Public Kindle dashboard endpoint (token protected)
│   ├── keepalive.js      # Cron job handler to keep Upstash database active
│   ├── login.js          # Admin PIN verification with IP rate limiting
│   ├── logout.js         # Admin logout
│   └── preview.js        # Live draft preview rendering
├── lib/                  # Shared business logic
│   ├── config.js         # Configuration schema, defaults, sanitization
│   ├── http.js           # Minimal Node req/res helpers
│   ├── ratelimit.js      # Redis-backed fixed window rate limiter
│   ├── redis.js          # Upstash Redis client singleton
│   ├── render.js         # Dashboard HTML generator & Kindle ES5 ticker
│   ├── security.js       # safeEqual, session signing, IP detection
│   └── weather.js        # Open-Meteo API client & WMO condition mapper
├── public/               # Static assets
│   ├── admin.html        # NASA-punk terminal admin UI (inline JS, framework CSS)
│   ├── index.html        # Signal terminal landing page
│   ├── css/              # 00 fonts, 01-06 vendored AG Nova framework, 08 Slate Hub extensions
│   ├── fonts/            # Self-hosted Space Grotesk, Inter Tight, IBM Plex Mono
│   └── js/               # nova-shell.js (entrance animation release, stardate)
├── vercel.json           # URL rewrites, security headers, cron schedules
└── package.json          # Package manifest (@upstash/redis)
```

---

## 3. Operational Rules

- **Direct to Production**: This repository deploys straight to production on Vercel Serverless.
- **Environment Variables**:
  - `UPSTASH_REDIS_REST_URL`: Upstash Redis REST endpoint.
  - `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST access token.
  - `ADMIN_PIN`: Master administrative PIN (minimum 8 characters).
  - `SESSION_SECRET`: 64-character hex key for HMAC signing (`openssl rand -hex 32`).
  - `DASHBOARD_TOKEN`: 32-character hex key for Kindle URL verification (`openssl rand -hex 16`).
  - `CRON_SECRET`: 32-character hex key for Vercel cron Bearer auth (`openssl rand -hex 16`).
- **Code Edits**: Keep changes minimal, clean, and modular. Read [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md) before making changes to slot logic or Redis keys.
- **Mandatory Documentation Invariant**: Every code or design change must be reflected in `CHANGELOG.md` and related documentation before finishing the task.

