# CLAUDE.md: AG Nova Slate Hub

Guidelines, coding invariants, and architectural rules for Anthropic Claude agents working on **AG Nova Slate Hub** (`ag-nova-slate-hub`).

For technical architecture and diagrams, see [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md).  
For operator setup and environment guide, see [README.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/README.md).  
For Gemini agent instructions, see [GEMINI.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/GEMINI.md).

---

## 1. Non-Negotiable Invariants

### 1. 100% English Language Rule
- **All code, comments, error responses, logs, documentation, and UI strings must be written strictly in English.**
- Never introduce Italian or other non-English language strings into this codebase.
- When adding NASA-punk terminal lore or report lines, write exclusively in thematic English.

### 2. Zero-Dependency & Zero-Build Philosophy
- **Do not introduce build tools or compilers.** No Vite, Webpack, Babel, TypeScript, Tailwind, or bundling pipelines.
- **Do not add npm runtime dependencies.** `@upstash/redis` is intentionally the **only** runtime dependency.
- All backend code must run directly in native Node.js (>=20) as standard ES Modules (`"type": "module"`).
- All frontend code in `public/` must remain vanilla HTML, CSS, and JavaScript.

### 3. Kindle Paperwhite 11 (E-Ink) Hardware Constraints
- The Kindle Experimental Browser runs an older, memory-constrained WebKit engine.
- **Any script served to the Kindle dashboard (in `lib/render.js`) MUST be strict ES5.**
  - Use `var`, `function`, `setTimeout`, and legacy DOM traversal.
  - Never use `const`, `let`, arrow functions, `fetch()`, `async/await`, or template literals inside strings injected into the Kindle view.
- Dashboard CSS must prioritize pure monochrome contrast (`#000` / `#fff`). Avoid animations, blurs, or intermediate gray gradients on text.
- Maintain `-webkit-` vendor prefixes for flexbox and transform rules in `lib/render.js`.

### 4. Security Standards
- **Constant-Time Comparison**: Never use standard equality (`===` or `==`) to verify tokens, PINs, or HMAC signatures. Always use `safeEqual(a, b)` from `lib/security.js`.
- **Session Cookie Security**: The `nova_admin` cookie must remain `HttpOnly; Secure; SameSite=Strict`.
- **Rate Limiting**: `api/login.js` must record attempts prior to evaluating PIN correctness to prevent brute-force timing vectors.

### 5. Mandatory Changelog & Documentation Updates
- **EVERY action, code modification, feature addition, bug fix, or refactor MUST result in an update to `CHANGELOG.md`.**
- If an action modifies architectural behavior, slot logic, layout mechanics, endpoints, or configuration, the agent MUST immediately update or create relevant documentation (e.g. `ARCHITECTURE.md`, `README.md`).
- Never complete a task or user turn without ensuring `CHANGELOG.md` reflects all changes made.

---

## 2. Directory Layout & Routing Map

```
ag-nova-slate-hub/
├── api/          # Serverless functions mapped to /api/*
│   ├── config.js       # GET / PUT configuration (session required)
│   ├── dashboard.js    # Renders Kindle HTML (/dashboard?k=TOKEN)
│   ├── keepalive.js    # Daily cron to keep Upstash free tier alive
│   ├── login.js        # PIN verification & rate limiting
│   ├── logout.js       # Clears session cookie
│   └── preview.js      # Renders draft HTML (/api/preview)
├── lib/          # Pure internal modules (never export HTTP handlers here)
│   ├── config.js       # Default config, sanitization, validation
│   ├── http.js         # Minimal Node req/res helpers & body reader
│   ├── ratelimit.js    # Fixed-window IP counter in Redis
│   ├── redis.js        # Upstash Redis client singleton
│   ├── render.js       # High-contrast e-ink HTML/CSS engine
│   ├── security.js     # safeEqual, session signing, client IP detection
│   └── weather.js      # Open-Meteo API consumer & WMO weather decoder
├── public/       # Static files served directly
│   ├── admin.html      # Self-contained NASA-punk terminal admin UI
│   └── index.html      # Signal fallback root page
├── vercel.json   # Rewrites (/dashboard, /admin), security headers, cron
└── package.json  # Project manifest
```

---

## 3. Common Development Guidance

- **Production Deployment**: The project deploys directly to Vercel Serverless.
- **Environment Variables**:
  - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis connection.
  - `ADMIN_PIN`: 8+ character master key for `/admin`.
  - `SESSION_SECRET`: 64-character hex secret for HMAC session signing.
  - `DASHBOARD_TOKEN`: 32-character hex secret for `/dashboard?k=...`.
  - `CRON_SECRET`: 32-character hex secret sent by Vercel cron as Bearer token.
- **Testing Changes**: When modifying `lib/render.js`, ensure both 0° and rotated (90°/270°) outputs render cleanly without overflowing Kindle viewport dimensions (`100vw`/`100vh`).
- **Mandatory Documentation Invariant**: Every code or design change must be reflected in `CHANGELOG.md` and related documentation before concluding a task.

