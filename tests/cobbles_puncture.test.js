import { describe, it, expect } from 'vitest';
import {
  createGameState,
  resolveMovement,
  TurnPhase
} from '../src/core/game_engine.js';
import { TerrainType } from '../src/core/terrain.js';
import { createMovementCard } from '../src/core/rider.js';
import { applyEnergyChange, calculateMovementConsumption } from '../src/core/energy.js';
import { rollPunctureOnCobbleStep, RaceEventId } from '../src/core/race_events.js';

function makeCourse(terrains, cobblePositions = []) {
  return terrains.map((terrain, index) => ({
    terrain,
    isRefuelZone: false,
    isCobbles: cobblePositions.includes(index + 1)
  }));
}

function makeResolveState(baseState, riderId, cardValue, diceResult) {
  const moveCard = createMovementCard(cardValue, 'Test', '#999999');
  const riders = baseState.riders.map(r =>
    r.id === riderId ? { ...r, hand: [moveCard] } : r
  );
  const rider = riders.find(r => r.id === riderId);

  return {
    ...baseState,
    currentTeam: rider.team,
    selectedRiderId: riderId,
    selectedCardId: moveCard.id,
    selectedSpecialtyId: null,
    lastDiceRoll: { result: diceResult, isOne: false },
    turnPhase: TurnPhase.RESOLVE,
    riders
  };
}

describe('cobbles puncture (V2.1)', () => {
  it('checks each cobble tile crossed', () => {
    const course = makeCourse(
      [TerrainType.FLAT, TerrainType.HILL, TerrainType.HILL, TerrainType.FLAT],
      [2, 3]
    );
    const state = createGameState({ courseLength: course.length });
    const [r1, r2] = state.riders;
    const riders = [
      { ...r1, position: 1, arrivalOrder: 0, hand: [], energy: 60 },
      { ...r2, position: 1, arrivalOrder: 1, hand: [], energy: 60 }
    ];

    const rngValues = [0.9, 0.05];
    const readyState = makeResolveState(
      {
        ...state,
        course,
        riders,
        raceEventState: {
          cooldownTurns: 0,
          weather: 'clear',
          lastCobblePunctureTurn: null,
          rng: () => (rngValues.length ? rngValues.shift() : 0.9)
        }
      },
      riders[0].id,
      2,
      1
    );

    const after = resolveMovement(readyState);
    const updated = after.riders.find(r => r.id === riders[0].id);

    expect(updated.raceEvent?.id).toBe(RaceEventId.PUNCTURE);
  });

  it('prevents multiple punctures in the same turn', () => {
    const course = makeCourse(
      [TerrainType.FLAT, TerrainType.HILL, TerrainType.HILL, TerrainType.FLAT],
      [2, 3]
    );
    const state = createGameState({ courseLength: course.length });
    const [r1, r2] = state.riders;
    const riders = [
      { ...r1, position: 1, arrivalOrder: 0, hand: [], energy: 60 },
      { ...r2, position: 1, arrivalOrder: 1, hand: [], energy: 60 }
    ];

    const firstState = makeResolveState(
      {
        ...state,
        course,
        riders,
        raceEventState: {
          cooldownTurns: 0,
          weather: 'clear',
          lastCobblePunctureTurn: null,
          rng: () => 0.0
        }
      },
      riders[0].id,
      2,
      1
    );

    const afterFirst = resolveMovement(firstState);
    const updatedFirst = afterFirst.riders.find(r => r.id === riders[0].id);
    expect(updatedFirst.raceEvent?.id).toBe(RaceEventId.PUNCTURE);

    const secondState = makeResolveState(
      {
        ...afterFirst,
        raceEventState: {
          ...afterFirst.raceEventState,
          rng: () => 0.0
        }
      },
      riders[1].id,
      2,
      1
    );

    const afterSecond = resolveMovement(secondState);
    const updatedSecond = afterSecond.riders.find(r => r.id === riders[1].id);
    expect(updatedSecond.raceEvent).toBeFalsy();
  });

  it('expires after the next move is applied', () => {
    const course = makeCourse([TerrainType.FLAT, TerrainType.FLAT, TerrainType.FLAT], []);
    const state = createGameState({ courseLength: course.length });
    const rider = {
      ...state.riders[0],
      position: 1,
      arrivalOrder: 0,
      hand: [],
      energy: 50,
      raceEvent: {
        id: RaceEventId.PUNCTURE,
        label: 'Crevaison',
        iconKey: 'warning',
        effects: { extraEnergyCost: 2 },
        turnsLeft: 1
      }
    };

    const readyState = makeResolveState(
      {
        ...state,
        course,
        riders: [rider],
        teamIds: [rider.team],
        raceEventState: { cooldownTurns: 0, weather: 'clear', lastCobblePunctureTurn: null }
      },
      rider.id,
      1,
      1
    );

    const after = resolveMovement(readyState);
    const updated = after.riders.find(r => r.id === rider.id);
    const distance = updated.position - rider.position;
    const expectedEnergy = applyEnergyChange(
      rider.energy,
      calculateMovementConsumption({
        distance,
        terrain: TerrainType.FLAT,
        riderType: rider.type,
        usedAttack: false,
        usedSpecialty: false,
        isLeading: false
      }) + 2,
      0
    );

    expect(updated.energy).toBe(expectedEnergy);
    expect(updated.raceEvent).toBeNull();
  });

  it('adjusts puncture chance with energy', () => {
    const rider = { energy: 60 };
    const rng = () => 0.11;

    expect(
      rollPunctureOnCobbleStep(rider, { energy: 60, rng })
    ).toBe(false);

    expect(
      rollPunctureOnCobbleStep(rider, { energy: 40, rng })
    ).toBe(true);
  });
});
