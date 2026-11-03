import { redis } from './redis.js';

export const CONFIG_KEY = 'nova:config';
export const MODULES = ['none', 'clock', 'weather', 'report'];
export const SLOTS = ['main', 'side1', 'side2', 'footer'];

export const DEFAULT_CONFIG = {
  version: 1,
  terminalId: 'KT-01',
  timezone: 'Europe/Rome',
  refreshMinutes: 15,
  rotation: 0,
  slots: { main: 'clock', side1: 'weather', side2: 'none', footer: 'report' },
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
  const slots = {};
  for (const s of SLOTS) {
    const m = i.slots && i.slots[s];
    slots[s] = MODULES.includes(m) ? m : d.slots[s];
  }
  const tz = str(i.timezone, d.timezone, 64);
  const lines = Array.isArray(i.report?.lines)
    ? i.report.lines.filter((l) => typeof l === 'string' && l.trim()).map((l) => l.trim().slice(0, 240)).slice(0, 50)
    : d.report.lines;
  return {
    version: 1,
    terminalId: str(i.terminalId, d.terminalId, 16),
    timezone: validTimezone(tz) ? tz : d.timezone,
    refreshMinutes: Math.round(num(i.refreshMinutes, d.refreshMinutes, 5, 120)),
    rotation: [0, 90, 270].includes(Number(i.rotation)) ? Number(i.rotation) : 0,
    slots,
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
