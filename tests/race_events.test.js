import { describe, it, expect } from 'vitest';
import { TerrainType } from '../src/core/terrain.js';
import {
  RaceEventDefinitions,
  RaceEventId,
  RaceWeather,
  rollRaceEvent,
  pickRaceEvent,
  attachRaceEvent,
  applyRaceEventMovement,
  getRaceEventEnergyPenalty,
  getRaceEventCardPenalty,
  tickRaceEvent
} from '../src/core/race_events.js';

function makeRider(id) {
  return {
    id,
    hasFinished: false,
    raceEvent: null,
    hasFallenThisTurn: false,
    turnsToSkip: 0
  };
}

describe('race events V2', () => {
  it('uses weighted selection when rider context is provided', () => {
    const riders = [makeRider('r1'), makeRider('r2')];
    const rolls = [0.95, 0, 0];
    const rng = () => (rolls.length ? rolls.shift() : 0);

    const result = rollRaceEvent({
      riders,
      ridersPlayedThisTurn: ['r1', 'r2'],
      getTerrainForRider: () => TerrainType.FLAT,
      getRiderContext: rider => ({
        terrain: TerrainType.FLAT,
        weight: rider.id === 'r2' ? 1 : 0.1
      }),
      weather: RaceWeather.CLEAR,
      cooldownTurns: 0,
      rng
    });

    expect(result.riderId).toBe('r2');
    expect(result.event).not.toBeNull();
  });

  it('respects cooldown and triggers after a pause', () => {
    const riders = [makeRider('r1')];
    const terrainFn = () => TerrainType.FLAT;

    const withCooldown = rollRaceEvent({
      riders,
      ridersPlayedThisTurn: ['r1'],
      getTerrainForRider: terrainFn,
      weather: RaceWeather.CLEAR,
      cooldownTurns: 1,
      rng: () => 0
    });

    expect(withCooldown.event).toBeNull();
    expect(withCooldown.cooldownTurns).toBe(0);

    const triggered = rollRaceEvent({
      riders,
      ridersPlayedThisTurn: ['r1'],
      getTerrainForRider: terrainFn,
      weather: RaceWeather.CLEAR,
      cooldownTurns: withCooldown.cooldownTurns,
      rng: () => 0
    });

    expect(triggered.event).not.toBeNull();
    expect(triggered.riderId).toBe('r1');
    expect(triggered.cooldownTurns).toBe(1);
  });

  it('applies event effects then clears next turn', () => {
    const rider = attachRaceEvent(makeRider('r1'), RaceEventDefinitions[RaceEventId.CRASH]);
    const reduced = applyRaceEventMovement(6, rider);

    expect(reduced).toBe(1);
    expect(getRaceEventEnergyPenalty(rider)).toBe(5);

    const cleared = tickRaceEvent(rider);
    expect(cleared.raceEvent).toBeNull();
  });

  it('rain increases crash likelihood on descents', () => {
    const clearEvent = pickRaceEvent({
      terrain: TerrainType.DESCENT,
      weather: RaceWeather.CLEAR,
      rng: () => 0.6
    });
    const rainEvent = pickRaceEvent({
      terrain: TerrainType.DESCENT,
      weather: RaceWeather.RAIN,
      rng: () => 0.6
    });

    expect(clearEvent?.id).not.toBe(RaceEventId.CRASH);
    expect(rainEvent?.id).toBe(RaceEventId.CRASH);
  });

  it('caps energy penalty for event effects', () => {
    const rider = {
      ...makeRider('r2'),
      raceEvent: {
        id: 'custom',
        label: 'Custom',
        effects: { extraEnergyCost: 12 }
      }
    };

    expect(getRaceEventEnergyPenalty(rider)).toBe(5);
    expect(getRaceEventCardPenalty(rider)).toBe(0);
  });
});
