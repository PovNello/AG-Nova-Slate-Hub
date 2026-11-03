import { redis } from './redis.js';

export const CONFIG_KEY = 'nova:config';
export const MODULES = ['none', 'clock', 'weather', 'report'];
export const PORTRAIT_SLOTS = ['top', 'middle', 'bottom'];
export const LANDSCAPE_SLOTS = ['main', 'side1', 'side2', 'footer'];
export const ORIENTATIONS = ['portrait', 'landscape'];

export const DEFAULT_CONFIG = {
  version: 2,
  terminalId: 'KT-01',
  timezone: 'Europe/Rome',
  refreshMinutes: 15,
  orientation: 'portrait',
  rotation: 0,
  slots: {
    portrait: { top: 'clock', middle: 'weather', bottom: 'report' },
    landscape: { main: 'clock', side1: 'weather', side2: 'none', footer: 'report' },
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
  return v !== '' && v !== null && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const bool = (v, def) => (typeof v === 'boolean' ? v : def);

function validTimezone(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}

// Always reconstructs a valid configuration starting from default values
export function sanitizeConfig(input) {
  const i = input && typeof input === 'object' ? input : {};
  const d = DEFAULT_CONFIG;

  const orientation = ORIENTATIONS.includes(i.orientation) ? i.orientation : d.orientation;

  // Handle slot migration (v1 flat slots vs v2 orientation-nested slots)
  const slotsInput = i.slots && typeof i.slots === 'object' ? i.slots : {};
  const hasNested = slotsInput.portrait || slotsInput.landscape;

  const portrait = {};
  for (const s of PORTRAIT_SLOTS) {
    let val;
    if (hasNested) {
      val = slotsInput.portrait?.[s];
    } else {
      // Map legacy v1 slots to portrait slots
      if (s === 'top') val = slotsInput.main;
      else if (s === 'middle') val = slotsInput.footer || slotsInput.side1;
      else val = slotsInput.side2;
    }
    portrait[s] = MODULES.includes(val) ? val : d.slots.portrait[s];
  }

  const landscape = {};
  for (const s of LANDSCAPE_SLOTS) {
    const val = hasNested ? slotsInput.landscape?.[s] : slotsInput[s];
    landscape[s] = MODULES.includes(val) ? val : d.slots.landscape[s];
  }

  const tz = str(i.timezone, d.timezone, 64);
  const lines = Array.isArray(i.report?.lines)
    ? i.report.lines.filter((l) => typeof l === 'string' && l.trim()).map((l) => l.trim().slice(0, 240)).slice(0, 50)
    : d.report.lines;

  return {
    version: 2,
    terminalId: str(i.terminalId, d.terminalId, 16),
    timezone: validTimezone(tz) ? tz : d.timezone,
    refreshMinutes: Math.round(num(i.refreshMinutes, d.refreshMinutes, 5, 120)),
    orientation,
    rotation: [0, 90, 270].includes(Number(i.rotation)) ? Number(i.rotation) : 0,
    slots: { portrait, landscape },
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

export async function getConfig() {
  const raw = await redis().get(CONFIG_KEY);
  return sanitizeConfig(raw || DEFAULT_CONFIG);
}

export async function saveConfig(input) {
  const cfg = sanitizeConfig(input);
  await redis().set(CONFIG_KEY, cfg);
  return cfg;
}
