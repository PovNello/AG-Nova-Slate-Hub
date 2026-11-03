# Changelog: AG Nova Slate Hub

All notable changes to **AG Nova Slate Hub** (`ag-nova-slate-hub`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For architecture details, refer to [ARCHITECTURE.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/ARCHITECTURE.md).  
For installation and quickstart, refer to [README.md](file:///c:/Gemini%20projects/AG%20Nova%20Slate%20Hub/README.md).

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

