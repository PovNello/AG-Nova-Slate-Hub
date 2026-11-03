import { redis } from './redis.js';

export const CONFIG_KEY = 'nova:config';
export const MODULES = ['none', 'clock', 'weather', 'report'];
export const ORIENTATIONS = ['portrait', 'landscape'];
export const ROW_COUNT = 3;

// Row height weights: 0.5 steps between 0.5 and 6
export const HEIGHT_MIN = 0.5;
export const HEIGHT_MAX = 6;
// Column split weights: integers between 1 and 9 (e.g. [3, 2] = 60/40)
export const SPLIT_MIN = 1;
export const SPLIT_MAX = 9;

export const DEFAULT_CONFIG = {
  version: 3,
  terminalId: 'KT-01',
  timezone: 'Europe/Rome',
  refreshMinutes: 15,
  orientation: 'portrait',
  flipped: false,
  layout: {
    portrait: {
      rows: [
        { height: 2, module: 'clock' },
        { height: 1, module: 'weather' },
        { height: 1, module: 'report' },
      ],
    },
    landscape: {
      rows: [
        { height: 2, split: [3, 2], cols: ['clock', 'weather'] },
        { height: 1, split: [1, 1], cols: ['none', 'none'] },
        { height: 1, split: [1, 1], cols: ['report', 'none'] },
      ],
    },
  },
  clock: { hour24: true, showDate: true },
  weather: { label: 'Bologna', latitude: 44.4949, longitude: 11.3426, hours: 4 },
  report: {
    lines: [
      'Kindle terminal operational. No anomalies detected, aside from another redesign in progress.',
      'The Captain initiated a new project. Probability of completion currently computing.',
      'Archive stable. External telemetry intercepted and cataloged with zero course deviations.',
      'Reactors on standby. N.O.V.A. core logging nominal status as always.',
    ],
  },
};

const str = (v, def, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : def);
const num = (v, def, min, max) => {
  const n = Number(v);
  return v !== '' && v !== null && v !== undefined && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const bool = (v, def) => (typeof v === 'boolean' ? v : def);
const mod = (v, def) => (MODULES.includes(v) ? v : def);

function validTimezone(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}

const cleanHeight = (v, def) => Math.round(num(v, def, HEIGHT_MIN, HEIGHT_MAX) * 2) / 2;
const cleanSplit = (v, def) =>
  Array.isArray(v) && v.length === 2
    ? [Math.round(num(v[0], def[0], SPLIT_MIN, SPLIT_MAX)), Math.round(num(v[1], def[1], SPLIT_MIN, SPLIT_MAX))]
    : [...def];

function cleanPortrait(input) {
  const d = DEFAULT_CONFIG.layout.portrait.rows;
  const rows = Array.isArray(input?.rows) ? input.rows : [];
  return {
    rows: d.map((def, r) => ({
      height: cleanHeight(rows[r]?.height, def.height),
      module: mod(rows[r]?.module, def.module),
    })),
  };
}

function cleanLandscape(input) {
  const d = DEFAULT_CONFIG.layout.landscape.rows;
  const rows = Array.isArray(input?.rows) ? input.rows : [];
  return {
    rows: d.map((def, r) => {
      const cols = Array.isArray(rows[r]?.cols) ? rows[r].cols : [];
      return {
        height: cleanHeight(rows[r]?.height, def.height),
        split: cleanSplit(rows[r]?.split, def.split),
        cols: [mod(cols[0], def.cols[0]), mod(cols[1], def.cols[1])],
      };
    }),
  };
}

// Converts v1 (flat slots) and v2 (orientation-nested slots) into the v3 row layout
function migrateSlots(slotsInput) {
  const s = slotsInput && typeof slotsInput === 'object' ? slotsInput : {};
  const nested = s.portrait || s.landscape;
  const p = nested
    ? s.portrait || {}
    : { top: s.main, middle: s.footer || s.side1, bottom: s.side2 };
  const l = nested ? s.landscape || {} : s;
  return {
    portrait: {
      rows: [
        { height: 1, module: p.top },
        { height: 1, module: p.middle },
        { height: 1, module: p.bottom },
      ],
    },
    landscape: {
      rows: [
        { height: 2, split: [3, 2], cols: [l.main, l.side1] },
        { height: 1, split: [1, 1], cols: [l.side2, 'none'] },
        { height: 1, split: [1, 1], cols: [l.footer, 'none'] },
      ],
    },
  };
}

// Always rebuilds a valid configuration starting from default values
export function sanitizeConfig(input) {
  const i = input && typeof input === 'object' ? input : {};
  const d = DEFAULT_CONFIG;

  const orientation = ORIENTATIONS.includes(i.orientation) ? i.orientation : d.orientation;
  const isV3 = i.layout && typeof i.layout === 'object';
  const layoutInput = isV3 ? i.layout : i.slots ? migrateSlots(i.slots) : d.layout;

  // v2 stored a free rotation: only 270° in landscape maps to "flipped"
  const flipped = typeof i.flipped === 'boolean'
    ? i.flipped
    : orientation === 'landscape' && Number(i.rotation) === 270;

  const tz = str(i.timezone, d.timezone, 64);
  const lines = Array.isArray(i.report?.lines)
    ? i.report.lines.filter((l) => typeof l === 'string' && l.trim()).map((l) => l.trim().slice(0, 240)).slice(0, 50)
    : d.report.lines;

  return {
    version: 3,
    terminalId: str(i.terminalId, d.terminalId, 16),
    timezone: validTimezone(tz) ? tz : d.timezone,
    refreshMinutes: Math.round(num(i.refreshMinutes, d.refreshMinutes, 5, 120)),
    orientation,
    flipped,
    layout: {
      portrait: cleanPortrait(layoutInput.portrait),
      landscape: cleanLandscape(layoutInput.landscape),
    },
    clock: {
      hour24: bool(i.clock?.hour24, d.clock.hour24),
      showDate: bool(i.clock?.showDate, d.clock.showDate),
    },
    weather: {
      label: str(i.weather?.label, d.weather.label, 40),
      latitude: num(i.weather?.latitude, d.weather.latitude, -90, 90),
      longitude: num(i.weather?.longitude, d.weather.longitude, -180, 180),
      hours: Math.round(num(i.weather?.hours, d.weather.hours, 0, 6)),
    },
    report: { lines: lines.length ? lines : d.report.lines },
  };
}

// Modules placed in the active orientation (used to decide which data to fetch)
export function activeModules(cfg) {
  return cfg.orientation === 'landscape'
    ? cfg.layout.landscape.rows.flatMap((r) => r.cols)
    : cfg.layout.portrait.rows.map((r) => r.module);
}

// Device rotation in degrees derived from orientation + flip
export function rotationOf(cfg) {
  if (cfg.orientation === 'landscape') return cfg.flipped ? 270 : 90;
  return cfg.flipped ? 180 : 0;
}

export async function getConfig() {
  const raw = await redis().get(CONFIG_KEY);
  return sanitizeConfig(raw || DEFAULT_CONFIG);
}

export async function saveConfig(input) {
  const cfg = sanitizeConfig(input);
  await redis().set(CONFIG_KEY, cfg);
  return cfg;
}
