// Open-Meteo: free, no API key required
const CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

export const describeCode = (c) => CODES[c] || 'Conditions N/A';

export async function getWeather({ latitude, longitude, hours }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '2',
  });
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?' + params, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const nowHour = j.current.time.slice(0, 13);
    const start = Math.max(0, j.hourly.time.findIndex((t) => t.slice(0, 13) === nowHour));
    const next = [];
    for (let k = 1; k <= hours; k++) {
      const idx = start + k * 3;
      if (idx >= j.hourly.time.length) break;
      next.push({
        time: j.hourly.time[idx].slice(11, 16),
        temp: Math.round(j.hourly.temperature_2m[idx]),
        code: j.hourly.weather_code[idx],
        rain: j.hourly.precipitation_probability?.[idx] ?? null,
      });
    }
    return {
      ok: true,
      temp: Math.round(j.current.temperature_2m),
      feels: Math.round(j.current.apparent_temperature),
      humidity: Math.round(j.current.relative_humidity_2m),
      wind: Math.round(j.current.wind_speed_10m),
      code: j.current.weather_code,
      min: Math.round(j.daily.temperature_2m_min[0]),
      max: Math.round(j.daily.temperature_2m_max[0]),
      next,
    };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}
