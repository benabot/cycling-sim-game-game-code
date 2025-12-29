import { describe, it, expect } from 'vitest';
import {
  applyEndOfTurnEffects,
  calculateMovement,
  createGameState,
  resolveMovement,
  TurnPhase
} from '../src/core/game_engine.js';
import { TerrainType } from '../src/core/terrain.js';
import { createMovementCard } from '../src/core/rider.js';

function makeCourse(terrains) {
  return terrains.map(terrain => ({ terrain }));
}

describe('Engine alignment - wind and energy', () => {
  it('applies wind on mountain/descent and consumes penalty on next move', () => {
    const course = makeCourse([
      TerrainType.MOUNTAIN,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.DESCENT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT
    ]);

    const state = createGameState({ courseLength: course.length });
    const riderMountain = { ...state.riders[0], position: 1, arrivalOrder: 0, hand: [] };
    const riderDescent = { ...state.riders[1], position: 4, arrivalOrder: 1, hand: [] };

    state.course = course;
    state.courseLength = course.length;
    state.finishLine = course.length;
    state.riders = [riderMountain, riderDescent];
    state.ridersPlayedThisTurn = [];
    state.arrivalCounter = 2;

    const after = applyEndOfTurnEffects(state);
    const windEffects = after.endTurnEffects.filter(effect => effect.type === 'wind');

    expect(windEffects).toHaveLength(2);

    const updatedMountain = after.riders.find(r => r.id === riderMountain.id);
    const updatedDescent = after.riders.find(r => r.id === riderDescent.id);

    expect(updatedMountain.windPenaltyNextMove).toBe(3);
    expect(updatedDescent.windPenaltyNextMove).toBe(3);

    const moveCard = createMovementCard(2, 'Test', '#999999');
    const nextState = {
      ...after,
      currentTeam: updatedMountain.team,
      selectedRiderId: updatedMountain.id,
      selectedCardId: moveCard.id,
      selectedSpecialtyId: null,
      lastDiceRoll: { result: 1, isOne: false },
      turnPhase: TurnPhase.RESOLVE,
      ridersPlayedThisTurn: [],
      riders: after.riders.map(r =>
        r.id === updatedMountain.id ? { ...r, hand: [moveCard] } : r
      ),
      gameLog: []
    };

    const resolved = resolveMovement(nextState);
    const resolvedRider = resolved.riders.find(r => r.id === updatedMountain.id);

    expect(resolvedRider.windPenaltyNextMove).toBe(0);
    expect(resolvedRider.energy).toBe(92);
  });

  it('forces recovery when energy is 0', () => {
    const course = makeCourse([TerrainType.FLAT, TerrainType.FLAT, TerrainType.FLAT]);
    const state = createGameState({ courseLength: course.length });
    const moveCard = createMovementCard(2, 'Test', '#999999');
    const rider = {
      ...state.riders[0],
      position: 1,
      energy: 0,
      hand: [moveCard]
    };

    state.course = course;
    state.courseLength = course.length;
    state.finishLine = course.length;
    state.riders = [rider];
    state.currentTeam = rider.team;
    state.selectedRiderId = rider.id;
    state.selectedCardId = moveCard.id;
    state.lastDiceRoll = { result: 4, isOne: false };
    state.turnPhase = TurnPhase.RESOLVE;
    state.ridersPlayedThisTurn = [];

    const resolved = resolveMovement(state);
    const resolvedRider = resolved.riders.find(r => r.id === rider.id);

    expect(resolvedRider.position).toBe(1);
    expect(resolvedRider.energy).toBe(10);
    expect(resolvedRider.hand.some(card => card.id === moveCard.id)).toBe(true);
  });

  it('keeps terrain bonus when exhausted', () => {
    const course = makeCourse([TerrainType.FLAT, TerrainType.FLAT, TerrainType.FLAT]);
    const state = createGameState({ courseLength: course.length });
    const moveCard = createMovementCard(2, 'Test', '#999999');
    const rider = {
      ...state.riders[2],
      position: 1,
      energy: 10,
      hand: [moveCard]
    };

    state.course = course;
    state.courseLength = course.length;
    state.finishLine = course.length;
    state.riders = [rider];
    state.selectedRiderId = rider.id;
    state.selectedCardId = moveCard.id;
    state.lastDiceRoll = { result: 1, isOne: false };

    const movement = calculateMovement(state);
    expect(movement).toBe(5);
  });
});
