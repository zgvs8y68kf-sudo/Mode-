import type { Weather } from "./types";

// Open-Meteo : gratuit, sans clé API, appelable depuis le navigateur.

const CODES: Record<number, string> = {
  0: "Ciel dégagé", 1: "Plutôt dégagé", 2: "Partiellement nuageux", 3: "Couvert",
  45: "Brouillard", 48: "Brouillard givrant", 51: "Bruine légère", 53: "Bruine", 55: "Bruine dense",
  61: "Pluie faible", 63: "Pluie", 65: "Forte pluie", 66: "Pluie verglaçante", 67: "Pluie verglaçante",
  71: "Neige faible", 73: "Neige", 75: "Forte neige", 77: "Grains de neige",
  80: "Averses", 81: "Averses", 82: "Fortes averses", 85: "Averses de neige", 86: "Averses de neige",
  95: "Orage", 96: "Orage et grêle", 99: "Orage et grêle",
};

export function weatherEmoji(code: number) {
  if (code === 0 || code === 1) return "☀️";
  if (code === 2) return "⛅";
  if (code === 3 || code === 45 || code === 48) return "☁️";
  if (code >= 71 && code <= 86 && code !== 80 && code !== 81 && code !== 82) return "❄️";
  if (code >= 95) return "⛈️";
  return "🌧️";
}

async function geocode(city: string) {
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?count=1&language=fr&name=${encodeURIComponent(city)}`,
  );
  const j = await r.json();
  const g = j.results?.[0];
  if (!g) throw new Error(`Ville introuvable : ${city}`);
  return { lat: g.latitude as number, lon: g.longitude as number, name: g.name as string };
}

export async function getWeather(opts: { city?: string; lat?: number; lon?: number }): Promise<Weather> {
  let { lat, lon } = opts;
  let city = opts.city ?? "Position actuelle";
  if (lat === undefined || lon === undefined) {
    const g = await geocode(opts.city || "Paris");
    lat = g.lat;
    lon = g.lon;
    city = g.name;
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=1`;
  const j = await (await fetch(url)).json();
  const code = j.current.weather_code as number;
  return {
    city,
    tempNow: Math.round(j.current.temperature_2m),
    feelsLike: Math.round(j.current.apparent_temperature),
    tempMin: Math.round(j.daily.temperature_2m_min[0]),
    tempMax: Math.round(j.daily.temperature_2m_max[0]),
    precipProb: j.daily.precipitation_probability_max[0] ?? 0,
    wind: Math.round(j.current.wind_speed_10m),
    code,
    label: CODES[code] ?? "—",
  };
}
