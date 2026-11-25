import useSWR from "swr";

export interface WeatherPlace {
  id: string;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
}

export type WeatherTempUnit = "C" | "F";
export type WeatherWindUnit = "kmh" | "mph";
export type WeatherRefreshMs = 30000 | 60000 | 120000;

export interface WeatherAppPreferences {
  tempUnit: WeatherTempUnit;
  windUnit: WeatherWindUnit;
  refreshMs: WeatherRefreshMs;
  selectedPlaceId: string;
  savedPlaces: WeatherPlace[];
  showHourlyPanel: boolean;
}

export interface HourlyForecastItem {
  timeIso: string;
  hourLabel: string;
  dayDateKey: string;
  tempC: number;
  weatherCode: number;
  conditionLabel: string;
  precipProb: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  dateKey: string;
  dayLabel: string;
  shortDate: string;
  isToday: boolean;
  weatherCode: number;
  conditionLabel: string;
  highC: number;
  lowC: number;
  precipProbMax: number;
  uvMax: number;
  windMaxKmh: number;
  sunriseTime: string;
  sunsetTime: string;
}

export interface RealtimeWeatherData {
  place: WeatherPlace;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  current: {
    tempC: number;
    feelsLikeC: number;
    humidity: number;
    windKmh: number;
    windDirectionDeg: number;
    pressureHpa: number;
    visibilityKm: number;
    dewPointC: number;
    uvIndex: number;
    cloudCover: number;
    weatherCode: number;
    conditionLabel: string;
    isDay: boolean;
    timeIso: string;
  };
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  fetchedAt: number;
}

export interface OpenMeteoRealtimeResponse {
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    dew_point_2m?: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m?: number;
    surface_pressure?: number;
    cloud_cover?: number;
    is_day?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: Array<number | null>;
    visibility?: Array<number | null>;
    uv_index?: Array<number | null>;
    dew_point_2m?: Array<number | null>;
    is_day?: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: Array<number | null>;
    uv_index_max?: Array<number | null>;
    wind_speed_10m_max?: Array<number | null>;
    sunrise?: string[];
    sunset?: string[];
  };
}

interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

export const DEFAULT_WEATHER_PLACES: WeatherPlace[] = [
  {
    id: "hanoi",
    name: "Hà Nội",
    subtitle: "Vietnam",
    latitude: 21.0285,
    longitude: 105.8542,
    countryCode: "VN",
  },
  {
    id: "hcmc",
    name: "TP. Hồ Chí Minh",
    subtitle: "Vietnam",
    latitude: 10.8231,
    longitude: 106.6297,
    countryCode: "VN",
  },
  {
    id: "danang",
    name: "Đà Nẵng",
    subtitle: "Vietnam",
    latitude: 16.0544,
    longitude: 108.2022,
    countryCode: "VN",
  },
];

export const WEATHER_APP_STORAGE_KEY = "sparkle_weather_app_prefs_v1";

export const DEFAULT_WEATHER_PREFS: WeatherAppPreferences = {
  tempUnit: "C",
  windUnit: "kmh",
  refreshMs: 60000,
  selectedPlaceId: "hanoi",
  savedPlaces: DEFAULT_WEATHER_PLACES,
  showHourlyPanel: true,
};

export function loadWeatherAppPrefs(fallbackCityId?: string): WeatherAppPreferences {
  try {
    const raw = localStorage.getItem(WEATHER_APP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WeatherAppPreferences>;
      const savedPlaces =
        Array.isArray(parsed.savedPlaces) && parsed.savedPlaces.length > 0
          ? parsed.savedPlaces
          : DEFAULT_WEATHER_PLACES;
      const selectedPlaceId =
        parsed.selectedPlaceId && savedPlaces.some((p) => p.id === parsed.selectedPlaceId)
          ? parsed.selectedPlaceId
          : (savedPlaces[0]?.id ?? "hanoi");
      const refreshMs: WeatherRefreshMs =
        parsed.refreshMs === 30000 || parsed.refreshMs === 60000 || parsed.refreshMs === 120000
          ? parsed.refreshMs
          : 60000;
      return {
        tempUnit: parsed.tempUnit === "F" ? "F" : "C",
        windUnit: parsed.windUnit === "mph" ? "mph" : "kmh",
        refreshMs,
        selectedPlaceId,
        savedPlaces,
        showHourlyPanel: parsed.showHourlyPanel !== false,
      };
    }
  } catch {
    // Ignore invalid storage payload
  }
  const initialId =
    fallbackCityId && DEFAULT_WEATHER_PLACES.some((p) => p.id === fallbackCityId)
      ? fallbackCityId
      : DEFAULT_WEATHER_PREFS.selectedPlaceId;
  return {
    ...DEFAULT_WEATHER_PREFS,
    selectedPlaceId: initialId,
  };
}

export function saveWeatherAppPrefs(prefs: WeatherAppPreferences): void {
  try {
    localStorage.setItem(WEATHER_APP_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota issues
  }
}

export function formatTemperature(tempC: number, unit: WeatherTempUnit): number {
  if (unit === "F") {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
}

export function formatWindSpeed(kmh: number, unit: WeatherWindUnit): string {
  if (unit === "mph") {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function getWindCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const normalized = ((deg % 360) + 360) % 360;
  return dirs[Math.round(normalized / 45) % 8] ?? "N";
}

export function getUvSeverityLabel(uv: number): string {
  const rounded = Math.round(uv);
  if (rounded <= 2) return "Low";
  if (rounded <= 5) return "Moderate";
  if (rounded <= 7) return "High";
  if (rounded <= 10) return "Very High";
  return "Extreme";
}

export function getWeatherConditionLabel(code: number, isDay = true): string {
  if (code === 0) return isDay ? "Clear Sky" : "Clear Night";
  if (code === 1) return isDay ? "Mostly Clear" : "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Mostly Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code === 56 || code === 57) return "Freezing Drizzle";
  if (code === 61) return "Light Rain";
  if (code === 63) return "Rain";
  if (code >= 65 && code <= 67) return "Heavy Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain Showers";
  if (code === 85 || code === 86) return "Snow Showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

export function mapOpenMeteoForecast(
  raw: OpenMeteoRealtimeResponse,
  place: WeatherPlace,
  fetchedAt = Date.now(),
): RealtimeWeatherData {
  const currentHourPrefix = raw.current.time.slice(0, 13);
  const currentIdx = Math.max(
    0,
    raw.hourly.time.findIndex((t) => t.slice(0, 13) >= currentHourPrefix),
  );

  const isDay = raw.current.is_day !== 0;
  const visibilityMeters = raw.hourly.visibility?.[currentIdx] ?? 10000;
  const currentUv = raw.hourly.uv_index?.[currentIdx] ?? 0;
  const currentDewPoint = raw.current.dew_point_2m ?? raw.hourly.dew_point_2m?.[currentIdx] ?? 0;

  const hourly: HourlyForecastItem[] = raw.hourly.time.map((timeIso, idx) => {
    const hourNum = Number.parseInt(timeIso.slice(11, 13), 10);
    const hIsDay = raw.hourly.is_day ? raw.hourly.is_day[idx] !== 0 : hourNum >= 6 && hourNum < 18;
    const code = raw.hourly.weather_code[idx] ?? 0;
    const hhmm = timeIso.slice(11, 16);
    return {
      timeIso,
      hourLabel: idx === currentIdx ? "Now" : hhmm,
      dayDateKey: timeIso.slice(0, 10),
      tempC: raw.hourly.temperature_2m[idx] ?? 0,
      weatherCode: code,
      conditionLabel: getWeatherConditionLabel(code, hIsDay),
      precipProb: Math.round(raw.hourly.precipitation_probability[idx] ?? 0),
      isDay: hIsDay,
    };
  });

  const daily: DailyForecastItem[] = raw.daily.time.map((dateKey, idx) => {
    const parsedDate = new Date(`${dateKey}T12:00:00Z`);
    const weekday = parsedDate.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
    const dayNum = parsedDate.getUTCDate();
    const code = raw.daily.weather_code[idx] ?? 0;
    const sunriseRaw = raw.daily.sunrise?.[idx];
    const sunsetRaw = raw.daily.sunset?.[idx];
    return {
      dateKey,
      dayLabel: idx === 0 ? "Today" : `${weekday} ${dayNum}`,
      shortDate: `${weekday} ${dayNum}`,
      isToday: idx === 0,
      weatherCode: code,
      conditionLabel: getWeatherConditionLabel(code, true),
      highC: raw.daily.temperature_2m_max[idx] ?? 0,
      lowC: raw.daily.temperature_2m_min[idx] ?? 0,
      precipProbMax: Math.round(raw.daily.precipitation_probability_max[idx] ?? 0),
      uvMax: raw.daily.uv_index_max?.[idx] ?? 0,
      windMaxKmh: raw.daily.wind_speed_10m_max?.[idx] ?? 0,
      sunriseTime: sunriseRaw ? sunriseRaw.slice(11, 16) : "--:--",
      sunsetTime: sunsetRaw ? sunsetRaw.slice(11, 16) : "--:--",
    };
  });

  return {
    place,
    timezone: raw.timezone,
    timezoneAbbreviation: raw.timezone_abbreviation,
    utcOffsetSeconds: raw.utc_offset_seconds,
    current: {
      tempC: raw.current.temperature_2m,
      feelsLikeC: raw.current.apparent_temperature,
      humidity: Math.round(raw.current.relative_humidity_2m),
      windKmh: raw.current.wind_speed_10m,
      windDirectionDeg: raw.current.wind_direction_10m ?? 0,
      pressureHpa: raw.current.surface_pressure ?? 1013.2,
      visibilityKm: Math.round((visibilityMeters / 1000) * 100) / 100,
      dewPointC: currentDewPoint,
      uvIndex: currentUv,
      cloudCover: raw.current.cloud_cover ?? 0,
      weatherCode: raw.current.weather_code,
      conditionLabel: getWeatherConditionLabel(raw.current.weather_code, isDay),
      isDay,
      timeIso: raw.current.time,
    },
    hourly,
    daily,
    fetchedAt,
  };
}

export function buildRealtimeForecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,is_day",
    hourly:
      "temperature_2m,weather_code,precipitation_probability,visibility,uv_index,dew_point_2m,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function fetchRealtimeWeather(place: WeatherPlace): Promise<RealtimeWeatherData> {
  const response = await fetch(buildRealtimeForecastUrl(place.latitude, place.longitude), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Weather API responded with status ${response.status}`);
  }
  const json = (await response.json()) as OpenMeteoRealtimeResponse;
  return mapOpenMeteoForecast(json, place, Date.now());
}

export async function searchWeatherPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<WeatherPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const params = new URLSearchParams({
    name: trimmed,
    count: "6",
    language: "en",
    format: "json",
  });
  const init: RequestInit = { cache: "no-store" };
  if (signal) {
    init.signal = signal;
  }
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, init);
  if (!response.ok) {
    throw new Error("Could not search locations");
  }
  const data = (await response.json()) as { results?: OpenMeteoGeocodingResult[] };
  if (!Array.isArray(data.results)) return [];
  return data.results.map((item) => {
    const subtitleParts = [item.admin1, item.country].filter(Boolean);
    const place: WeatherPlace = {
      id: `geo-${item.id}`,
      name: item.name,
      subtitle: subtitleParts.join(", ") || "Global",
      latitude: item.latitude,
      longitude: item.longitude,
    };
    if (item.country_code) {
      place.countryCode = item.country_code;
    }
    return place;
  });
}

export function useRealtimeWeather(place: WeatherPlace, refreshMs: WeatherRefreshMs) {
  return useSWR<RealtimeWeatherData>(
    ["realtime-weather-v1", place.id, place.latitude.toFixed(4), place.longitude.toFixed(4)],
    () => fetchRealtimeWeather(place),
    {
      refreshInterval: refreshMs,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      dedupingInterval: 10 * 1000,
    },
  );
}
