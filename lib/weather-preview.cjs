"use strict";
// Trusted, deterministic author-preview data. Never a real IP/city request.
exports.fixture = function (kind) {
  const city = {
    id: 2950159,
    name: "Berlin",
    latitude: 52.52,
    longitude: 13.41,
    country: "Germany",
    admin1: "Berlin",
  };
  if (kind === "search") return { results: [city] };
  if (kind === "get") return city;
  if (kind === "auto")
    return {
      city: "Berlin",
      latitude: "52.52",
      longitude: "13.41",
      country_code: "DE",
    };
  const dates = Array.from({ length: 4 }, (_, i) =>
    new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
  );
  return {
    timezone: "UTC",
    utc_offset_seconds: 0,
    current: {
      temperature_2m: -3,
      apparent_temperature: -7,
      relative_humidity_2m: 78,
      wind_speed_10m: 4,
      weather_code: 3,
      is_day: 1,
    },
    daily: {
      time: dates,
      temperature_2m_min: [-7, -8, -5, -4],
      temperature_2m_max: [-1, -2, 0, 1],
      weather_code: [3, 73, 2, 0],
      precipitation_probability_max: [20, 60, 10, 0],
    },
  };
};
