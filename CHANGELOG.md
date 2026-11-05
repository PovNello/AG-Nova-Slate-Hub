# Changelog: AG Nova Slate Hub

All notable changes to **AG Nova Slate Hub** (`ag-nova-slate-hub`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For architecture details, refer to [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md).  
For installation and quickstart, refer to [README.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/README.md).

---

## [0.4.2] - 2026-11-05

### Added
- **Landing Page** (`public/index.html`): Replaced the bare "SIGNAL NOT FOUND" placeholder with a full NASA-punk landing page matching the admin UI/UX. Features: branded topbar with logo + pulsing LED, hero block with 96px logo and system tagline, two mission cards — `[01] ADMIN` (direct link to `/admin`) and `[02] DASHBOARD` (token input field + dynamic link to `/dashboard?token=...`), and a footer with system status indicator. No new dependencies; vanilla JS ES5-compatible.

### Changed
- **`public/index.html`**: Fully rewritten from a one-line stub to a complete styled landing page.

---

## [0.4.1] - 2026-11-05

### Added
- **Brand Logo / Favicon**: Added `slate-hub-logo.svg` as the site favicon (`<link rel="icon" type="image/svg+xml">`) in both `public/admin.html` and `public/index.html`.
- **Logo in Nav/Status Bar**: The SVG logo now appears at the far left of the admin topbar (before the pulsing LED and "AG NOVA SLATE HUB // TERMINAL CONFIG" text) and in the login header (before the LED and "AG NOVA SLATE HUB // ADMIN TERMINAL").

### Changed
- **Asset Location**: Moved `slate-hub-logo.svg` from the project root to `public/` — the correct static-asset directory served by Vercel.

---

## [0.4.0] - 2026-11-03

### Added
- **Landscape Mode Enabled**: Landscape is now a fully active orientation, selectable through `PORTRAIT` / `LANDSCAPE` mode buttons in the admin layout panel.
- **Flip Screen (180°)**: New `flipped` toggle replaces the free rotation dropdown. Portrait renders at 0° / 180°, landscape at 90° / 270°. Added the `.rot180` transform class and `rotationOf()` helper.
- **Weighted Row Engine**: Portrait uses 3 rows; landscape uses a 3 rows x 2 columns grid. Each row has a height weight (0.5 to 6), and each landscape row has its own column split (presets 50/50, 60/40, 67/33, 70/30, 40/60, 33/67, 30/70).
- **Auto-Expand**: In landscape, a row with a single filled column expands that module to 100% of the row width.
- **Box-Aware Typography**: Module text is now in `em` and each panel gets a server-computed scale from its box size, so modules stay proportionate in large rows and narrow columns.
- **Interactive Schematic**: Admin shows per-row height inputs with live height percentages, split selectors, proportional column previews, and COLLAPSED / AUTO-EXPANDED indicators.

### Changed
- **Config Schema v3**: Replaced `slots` and `rotation` with `layout.portrait.rows`, `layout.landscape.rows` and `flipped`. v1 and v2 configs in Redis are migrated automatically on read.
- **Preview Rendering**: `/api/preview` renders without device rotation inside a 3:4 or 4:3 frame; the preview header shows the flip state.
- **Clock Script**: Updates every `nova-clock` element instead of a single id, so a clock can be placed in more than one slot. Still strict ES5.
- **Rows Collapse**: Empty rows collapse and the remaining rows re-share the height by weight.
- **Documentation**: Updated `ARCHITECTURE.md` (layout engine, rotation table, sizing and migration rules), `README.md` and `CLAUDE.md` test guidance.

### Removed
- Orientation dropdown with the disabled landscape option, and the 0° / 90° / 270° rotation dropdown.

---

## [0.3.0] - 2026-11-03

### Added
- **Native Portrait Orientation**: Added explicit `orientation: 'portrait' | 'landscape'` to configuration schema in `lib/config.js`, establishing portrait as the primary native mode for Kindle devices.
- **Independent Slot Engine**: Split slot layouts by orientation into `slots.portrait` (`top`, `middle`, `bottom`) and `slots.landscape` (`main`, `side1`, `side2`, `footer`).
- **Dynamic Admin Schematic**: Admin schematic dynamically reconfigures between a vertical 3-stack layout in portrait mode and a 2-column grid in landscape mode.
- **Kindle E-Reader Admin Preview**: Updated preview container to `3/4` portrait aspect ratio with realistic e-reader bezel framing and `[PRV] KINDLE PREVIEW // PORTRAIT` status header.
- **Orientation Selector**: Added an orientation selector under Terminal Settings with Portrait active and Landscape prepared as a disabled roadmap option.

### Changed
- **Responsive Non-Clipping Layout**: Replaced fixed-height landscape stacking with dynamic `.grid-portrait` flex engine where active slots share viewport height evenly (`flex: 1`), eliminating content cutoffs.
- **Kindle WebKit Flexbox Compliance**: Applied full double-prefixing (`-webkit-box`, `-webkit-flex`, `-webkit-box-orient: vertical`, `-webkit-box-direction: normal`) across all dashboard flex structures for 100% Kindle Experimental Browser reliability.
- **Typography & Overflow Protection**: Calibrated chronometer font size to `15vmin` with flexible margins, weather temperature to `8.5vmin`, and added `text-overflow: ellipsis` safeguards to prevent multi-line date and status wrapping.
- **Schema Auto-Migration**: Bumped config version to `2` with automated backward-compatibility mapping for existing flat-slot configurations in Upstash Redis.
- **Architecture Documentation**: Updated `ARCHITECTURE.md` Section 3 to document the orientation-aware slot engine and responsive flex behaviors.

---

## [0.2.0] - 2026-11-03

### Added
- **Architectural Documentation**: Created [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md) covering the system flow, slot engine, Redis schema, and e-ink WebKit guidelines.
- **Agent Guidelines**: Added [CLAUDE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/CLAUDE.md) and [GEMINI.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/GEMINI.md) establishing strict coding invariants, zero-dependency requirements, and English language standardization.
- **Project Documentation**: Standardized [README.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/README.md) with an architecture flow chart, environment variable table, and Kindle setup guide.
- **Security Protections**: Enhanced `.gitignore` to explicitly prevent committing `.env` files and operating system metadata.

### Changed
- **Naming Standardization**: Unified project name to **AG Nova Slate Hub** with package identifier `ag-nova-slate-hub`.
- **Language Alignment**: Converted 100% of codebase, API error responses, comments, and admin UI from Italian to English.
- **NASA-Punk Lore**: Updated default terminal report logs to authentic English sci-fi logs.
- **Weather Localization**: Shifted Open-Meteo geocoding query from Italian to English (`language=en`) and WMO weather codes to standard English descriptions.
- **Date Formatting**: Migrated clock module date formatting from `it-IT` to `en-US`.

---

## [0.1.0] - Initial Prototype

### Added
- Core Kindle e-ink dashboard with 4-slot modular layout.
- Open-Meteo integration for live temperature and hourly forecasts.
- Single-file NASA-punk administration panel (`public/admin.html`).
- Vercel serverless API handlers for session management, configuration persistence, and live previews.
- Upstash Redis storage backend and daily keepalive cron job.

