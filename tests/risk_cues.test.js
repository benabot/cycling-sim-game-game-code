import { describe, it, expect } from 'vitest';
import { computeRiskCue } from '../src/core/risk_cues.js';
import { TerrainType } from '../src/core/terrain.js';
import { RaceWeather } from '../src/core/race_weather.js';

describe('risk cues (V2.4)', () => {
  it('prioritizes cobbles as puncture risk', () => {
    const cue = computeRiskCue({
      terrain: TerrainType.FLAT,
      isCobbles: true,
      isExposed: true,
      weather: RaceWeather.CLEAR
    });

    expect(cue.type).toBe('Crevaison');
    expect(cue.level).toBe('Élevé');
    expect(cue.reason).toBe('Pavés');
  });

  it('marks descent in rain as crash risk', () => {
    const cue = computeRiskCue({
      terrain: TerrainType.DESCENT,
      isCobbles: false,
      isExposed: false,
      weather: RaceWeather.RAIN
    });

    expect(cue.type).toBe('Chute');
    expect(cue.level).toBe('Élevé');
    expect(cue.reason).toBe('Descente sous pluie');
  });

  it('uses exposure for incident risk when wind blows', () => {
    const cue = computeRiskCue({
      terrain: TerrainType.FLAT,
      isCobbles: false,
      isExposed: true,
      weather: RaceWeather.WIND
    });

    expect(cue.type).toBe('Incident');
    expect(cue.level).toBe('Modéré');
    expect(cue.reason).toBe('Groupe instable');
  });
});
