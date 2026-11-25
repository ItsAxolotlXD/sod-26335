import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEATHER_PLACES,
  formatTemperature,
  formatWindSpeed,
  getUvSeverityLabel,
  getWeatherConditionLabel,
  getWindCompass,
  mapOpenMeteoForecast,
  type OpenMeteoRealtimeResponse,
} from "./useRealtimeWeather";

describe("useRealtimeWeather helpers", () => {
  it("converts temperatures and wind speeds accurately", () => {
    expect(formatTemperature(26, "C")).toBe(26);
    expect(formatTemperature(25, "F")).toBe(77);
    expect(formatTemperature(0, "F")).toBe(32);

    expect(formatWindSpeed(16, "kmh")).toBe("16 km/h");
    expect(formatWindSpeed(16, "mph")).toBe("10 mph");
  });

  it("maps wind directions, UV levels, and WMO weather codes cleanly", () => {
    expect(getWindCompass(0)).toBe("N");
    expect(getWindCompass(45)).toBe("NE");
    expect(getWindCompass(225)).toBe("SW");

    expect(getUvSeverityLabel(2)).toBe("Low");
    expect(getUvSeverityLabel(5)).toBe("Moderate");
    expect(getUvSeverityLabel(7)).toBe("High");
    expect(getUvSeverityLabel(9)).toBe("Very High");
    expect(getUvSeverityLabel(11)).toBe("Extreme");

    expect(getWeatherConditionLabel(0, true)).toBe("Clear Sky");
    expect(getWeatherConditionLabel(0, false)).toBe("Clear Night");
    expect(getWeatherConditionLabel(2, true)).toBe("Partly Cloudy");
    expect(getWeatherConditionLabel(95, true)).toBe("Thunderstorm");
  });

  it("maps an Open-Meteo response into structured current, hourly, and daily forecast data", () => {
    const sample: OpenMeteoRealtimeResponse = {
      timezone: "Europe/Bucharest",
      timezone_abbreviation: "EEST",
      utc_offset_seconds: 10800,
      current: {
        time: "2026-11-23T16:45",
        temperature_2m: 26.2,
        apparent_temperature: 26.0,
        relative_humidity_2m: 50,
        dew_point_2m: 14.1,
        weather_code: 2,
        wind_speed_10m: 16.2,
        wind_direction_10m: 45,
        surface_pressure: 1016.9,
        cloud_cover: 40,
        is_day: 1,
      },
      hourly: {
        time: ["2026-11-23T15:00", "2026-11-23T16:00", "2026-11-23T17:00"],
        temperature_2m: [25.4, 26.1, 24.3],
        weather_code: [2, 2, 3],
        precipitation_probability: [0, 5, 10],
        visibility: [11270, 11270, 10500],
        uv_index: [3, 2, 1],
        dew_point_2m: [14, 14, 13.5],
        is_day: [1, 1, 1],
      },
      daily: {
        time: ["2026-11-23", "2026-11-24"],
        weather_code: [2, 0],
        temperature_2m_max: [27.8, 29.6],
        temperature_2m_min: [18.1, 16.2],
        precipitation_probability_max: [3, 0],
        uv_index_max: [5.4, 6.2],
        wind_speed_10m_max: [19, 14],
        sunrise: ["2026-11-23T06:40", "2026-11-24T06:41"],
        sunset: ["2026-11-23T17:30", "2026-11-24T17:29"],
      },
    };

    const place = DEFAULT_WEATHER_PLACES[0]!;
    const mapped = mapOpenMeteoForecast(sample, place, 1700000000000);

    expect(mapped.current.tempC).toBeCloseTo(26.2);
    expect(mapped.current.conditionLabel).toBe("Partly Cloudy");
    expect(mapped.current.pressureHpa).toBeCloseTo(1016.9);
    expect(mapped.current.visibilityKm).toBe(11.27);
    expect(mapped.current.uvIndex).toBe(2);

    expect(mapped.hourly).toHaveLength(3);
    expect(mapped.hourly[1]?.hourLabel).toBe("Now");
    expect(mapped.hourly[2]?.hourLabel).toBe("17:00");

    expect(mapped.daily).toHaveLength(2);
    expect(mapped.daily[0]?.dayLabel).toBe("Today");
    expect(mapped.daily[0]?.sunriseTime).toBe("06:40");
    expect(mapped.fetchedAt).toBe(1700000000000);
  });
});
