import { TerrainType } from './terrain.js';
import { RaceWeather } from './race_weather.js';

export function computeRiskCue({
  terrain = TerrainType.FLAT,
  isCobbles = false,
  isExposed = false,
  weather = RaceWeather.CLEAR
} = {}) {
  const isRain = weather === RaceWeather.RAIN;
  const isWind = weather === RaceWeather.WIND;
  const hasBadWeather = weather !== RaceWeather.CLEAR;
  const isDangerTerrain = isCobbles || (terrain === TerrainType.DESCENT && isRain);

  let level = 'Faible';
  if (isDangerTerrain) {
    level = 'Élevé';
  } else if (isExposed) {
    level = 'Modéré';
  } else if (hasBadWeather) {
    level = 'Modéré';
  }

  let reason = 'Groupe stable';
  if (isCobbles) {
    reason = 'Pavés';
  } else if (terrain === TerrainType.DESCENT && isRain) {
    reason = 'Descente sous pluie';
  } else if (isExposed) {
    reason = 'Groupe instable';
  } else if (hasBadWeather) {
    reason = 'Météo défavorable';
  }

  let type = 'Incident';
  if (isCobbles) {
    type = 'Crevaison';
  } else if (terrain === TerrainType.DESCENT && isRain) {
    type = 'Chute';
  } else if (isWind && isExposed) {
    type = 'Incident';
  } else if (isExposed) {
    type = 'Incident';
  } else if (isRain) {
    type = 'Chute';
  } else if (isWind) {
    type = 'Incident';
  }

  return { level, reason, type };
}
