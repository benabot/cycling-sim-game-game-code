/**
 * Race weather - v2.3 (soft modifiers)
 * @module core/race_weather
 */

export const RaceWeather = {
  CLEAR: 'clear',
  WIND: 'wind',
  RAIN: 'rain'
};

const WEATHER_WEIGHTS = [
  { id: RaceWeather.CLEAR, weight: 0.6 },
  { id: RaceWeather.WIND, weight: 0.2 },
  { id: RaceWeather.RAIN, weight: 0.2 }
];

const WEATHER_LABELS = {
  [RaceWeather.CLEAR]: 'Normal',
  [RaceWeather.WIND]: 'Vent latéral',
  [RaceWeather.RAIN]: 'Pluie'
};

const WEATHER_ICONS = {
  [RaceWeather.CLEAR]: 'road',
  [RaceWeather.WIND]: 'wind',
  [RaceWeather.RAIN]: 'rain'
};

const WIND_PENALTY_BONUS = 1;
const SHELTER_REDUCTION = 1;
const COBBLES_PUNCTURE_RAIN_BONUS = 0.02;
const COBBLES_CRASH_RAIN_BONUS = 0.1;

export function rollRaceWeather({ rng = Math.random, presetWeather = null } = {}) {
  if (presetWeather) return presetWeather;
  const total = WEATHER_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = rng() * total;
  let cursor = 0;
  for (const entry of WEATHER_WEIGHTS) {
    cursor += entry.weight;
    if (roll <= cursor) return entry.id;
  }
  return RaceWeather.CLEAR;
}

export function getWeatherLabel(weather) {
  return WEATHER_LABELS[weather] || WEATHER_LABELS[RaceWeather.CLEAR];
}

export function getWeatherIconKey(weather) {
  return WEATHER_ICONS[weather] || WEATHER_ICONS[RaceWeather.CLEAR];
}

export function getWeatherLogLine(weather) {
  if (weather === RaceWeather.WIND) return '🌬️ Vent latéral sur le parcours';
  if (weather === RaceWeather.RAIN) return '🌧️ Pluie sur le parcours';
  return '';
}

export function applyWindPenaltyModifier(basePenalty, weather) {
  if (weather !== RaceWeather.WIND) return basePenalty;
  return basePenalty + WIND_PENALTY_BONUS;
}

export function applyShelterRecoveryModifier(recovery, weather, isSheltered) {
  if (!isSheltered || weather !== RaceWeather.WIND) return recovery;
  return Math.max(0, recovery - SHELTER_REDUCTION);
}

export function getCobblePunctureWeatherBonus(weather) {
  return weather === RaceWeather.RAIN ? COBBLES_PUNCTURE_RAIN_BONUS : 0;
}

export function getCobbleCrashWeatherBonus(weather) {
  return weather === RaceWeather.RAIN ? COBBLES_CRASH_RAIN_BONUS : 0;
}
