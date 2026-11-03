# AGENTS.md: Universal Guidelines for AI Coding Agents

Operational standards and mandatory workflows for all AI coding agents (Google Gemini, Anthropic Claude, OpenAI, and others) working on **AG Nova Slate Hub** (`ag-nova-slate-hub`).

For technical architecture and diagrams, see [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md).  
For operator setup and environment guide, see [README.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/README.md).  
For release history, see [CHANGELOG.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/CHANGELOG.md).  
For Gemini-specific guidelines, see [GEMINI.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/GEMINI.md).  
For Claude-specific guidelines, see [CLAUDE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/CLAUDE.md).

---

## 1. Mandatory Invariants for All Agents

### 1. Mandatory Changelog & Documentation Updates (MANDATORY)
* **EVERY action, code modification, feature addition, bug fix, or refactor MUST result in an update to [CHANGELOG.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/CHANGELOG.md).**
* If an action modifies architectural behavior, slot logic, layout mechanics, endpoints, or configuration, the agent MUST immediately update or create relevant documentation (e.g. [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md), [README.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/README.md)).
* Never conclude a turn or mark a task complete without verifying that `CHANGELOG.md` accurately documents the changes.

### 2. 100% English Language Rule
* **All code, comments, error responses, logs, documentation, and UI strings must be written strictly in English.**
* Never introduce Italian or other non-English language strings under any circumstances.
* Sci-fi / NASA-punk lore strings in `lib/config.js` or `public/admin.html` must remain in atmospheric English.

### 3. Zero-Build & Minimal Footprint
* **Do not install frontend frameworks** (React, Vue, Svelte) or CSS bundlers (Tailwind, PostCSS, Vite, Webpack).
* **Do not add runtime dependencies beyond `@upstash/redis`.**
* Rely strictly on native Node.js ES Modules (`"type": "module"`) and vanilla web standards.

### 4. E-Ink / Kindle Paperwhite 11 Compatibility
* The Kindle Experimental Browser runs an older, memory-constrained WebKit engine.
* **Client scripts embedded in the dashboard HTML (`lib/render.js`) MUST use strict ES5 syntax.**
  * No `const`, `let`, arrow functions, promises, `async/await`, or template literals in the Kindle script.
  * Use `var`, standard `function`, and basic DOM manipulation.
* Maintain `-webkit-` vendor prefixes in dashboard CSS for transformations and flexbox support.
* High-contrast monochrome (`#000` on `#fff`) only.

### 5. Security Invariants
* **Constant-Time Verification**: Always use `safeEqual` from `lib/security.js` when verifying `DASHBOARD_TOKEN`, `ADMIN_PIN`, or session cookies to prevent timing attacks.
* **Session Protection**: Ensure the `nova_admin` cookie keeps `HttpOnly; Secure; SameSite=Strict`.
* **IP Rate Limiting**: All login attempts must be incremented in Redis before PIN evaluation.

