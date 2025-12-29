import { describe, it, expect } from 'vitest';
import {
  applyEndOfTurnEffects,
  calculateMovement,
  createGameState,
  resolveMovement,
  selectCard,
  selectSpecialty,
  TurnPhase
} from '../src/core/game_engine.js';
import {
  applyEnergyChange,
  calculateMovementConsumption,
  calculateRecovery
} from '../src/core/energy.js';
import { TerrainType } from '../src/core/terrain.js';
import { createAttackCard, createMovementCard, createSpecialtyCard } from '../src/core/rider.js';

function makeCourse(terrains, refuelPositions = []) {
  return terrains.map((terrain, index) => ({
    terrain,
    isRefuelZone: refuelPositions.includes(index + 1)
  }));
}

// Helper for tests: build a resolve-ready state for a specific rider.
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
    ridersPlayedThisTurn: [],
    gameLog: [],
    riders
  };
}

describe('Wind rules', () => {
  it('applies wind on mountain/descent for rouleur and non-rouleur, penalty on next move', () => {
    // Arrange
    const course = makeCourse([
      TerrainType.MOUNTAIN,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.DESCENT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT
    ]);
    const state = createGameState({ courseLength: course.length });
    const riderMountain = {
      ...state.riders[0],
      type: 'climber',
      position: 1,
      arrivalOrder: 0,
      hand: [],
      energy: 100
    };
    const riderDescent = {
      ...state.riders[1],
      type: 'rouleur',
      position: 4,
      arrivalOrder: 1,
      hand: [],
      energy: 100
    };

    state.course = course;
    state.courseLength = course.length;
    state.finishLine = course.length;
    state.riders = [riderMountain, riderDescent];
    state.ridersPlayedThisTurn = [];
    state.arrivalCounter = 2;

    // Act
    const after = applyEndOfTurnEffects(state);
    const windEffects = after.endTurnEffects.filter(effect => effect.type === 'wind');

    // Assert
    expect(windEffects).toHaveLength(2);

    const mountainEffect = windEffects.find(effect => effect.riderId === riderMountain.id);
    const descentEffect = windEffects.find(effect => effect.riderId === riderDescent.id);

    expect(mountainEffect.cardValue).toBe(1);
    expect(mountainEffect.windPenalty).toBe(3);
    expect(descentEffect.cardValue).toBe(2);
    expect(descentEffect.windPenalty).toBe(5);

    const updatedMountain = after.riders.find(r => r.id === riderMountain.id);
    const updatedDescent = after.riders.find(r => r.id === riderDescent.id);

    expect(updatedMountain.windPenaltyNextMove).toBe(3);
    expect(updatedDescent.windPenaltyNextMove).toBe(5);

    const mountainState = makeResolveState(after, riderMountain.id, 2, 1);
    const descentState = makeResolveState(after, riderDescent.id, 2, 1);

    const resolvedMountain = resolveMovement(mountainState);
    const resolvedDescent = resolveMovement(descentState);

    const mountainAfter = resolvedMountain.riders.find(r => r.id === riderMountain.id);
    const descentAfter = resolvedDescent.riders.find(r => r.id === riderDescent.id);

    const mountainDistance = mountainAfter.position - riderMountain.position;
    const descentDistance = descentAfter.position - riderDescent.position;

    const mountainConsumed = calculateMovementConsumption({
      distance: mountainDistance,
      terrain: TerrainType.MOUNTAIN,
      riderType: riderMountain.type,
      usedAttack: false,
      usedSpecialty: false,
      isLeading: false
    }) + 3;

    const descentConsumed = calculateMovementConsumption({
      distance: descentDistance,
      terrain: TerrainType.DESCENT,
      riderType: riderDescent.type,
      usedAttack: false,
      usedSpecialty: false,
      isLeading: false
    }) + 5;

    const mountainExpected = applyEnergyChange(
      riderMountain.energy,
      mountainConsumed,
      0
    );
    const descentRecovered = calculateRecovery({
      terrain: TerrainType.DESCENT,
      distance: descentDistance,
      isSheltered: false,
      inRefuelZone: false
    });
    const descentExpected = applyEnergyChange(
      riderDescent.energy,
      descentConsumed,
      descentRecovered
    );

    expect(mountainAfter.windPenaltyNextMove).toBe(0);
    expect(descentAfter.windPenaltyNextMove).toBe(0);
    expect(mountainAfter.energy).toBe(mountainExpected);
    expect(descentAfter.energy).toBe(descentExpected);
  });

  it('consumes wind penalty once on the next move', () => {
    // Arrange
    const course = makeCourse([
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT,
      TerrainType.FLAT
    ]);
    const state = createGameState({ courseLength: course.length });
    const rider = {
      ...state.riders[0],
      type: 'versatile',
      position: 1,
      arrivalOrder: 0,
      hand: [],
      energy: 80
    };
    const otherRider = {
      ...state.riders[1],
      position: 6,
      arrivalOrder: 1,
      hand: []
    };

    state.course = course;
    state.courseLength = course.length;
    state.finishLine = course.length;
    state.riders = [rider, otherRider];
    state.ridersPlayedThisTurn = [];
    state.arrivalCounter = 2;

    const after = applyEndOfTurnEffects(state);
    const windyRider = after.riders.find(r => r.id === rider.id);

    // Act
    const firstState = makeResolveState(after, rider.id, 2, 2);
    const firstResolved = resolveMovement(firstState);
    const firstAfter = firstResolved.riders.find(r => r.id === rider.id);

    const secondState = makeResolveState(firstResolved, rider.id, 2, 2);
    const secondResolved = resolveMovement(secondState);
    const secondAfter = secondResolved.riders.find(r => r.id === rider.id);

    // Assert
    const firstDistance = firstAfter.position - rider.position;
    const secondDistance = secondAfter.position - firstAfter.position;

    const firstConsumed = calculateMovementConsumption({
      distance: firstDistance,
      terrain: TerrainType.FLAT,
      riderType: rider.type,
      usedAttack: false,
      usedSpecialty: false,
      isLeading: false
    }) + (windyRider.windPenaltyNextMove || 0);

    const secondConsumed = calculateMovementConsumption({
      distance: secondDistance,
      terrain: TerrainType.FLAT,
      riderType: rider.type,
      usedAttack: false,
      usedSpecialty: false,
      isLeading: false
    });

    const expectedAfterFirst = applyEnergyChange(rider.energy, firstConsumed, 0);
    const expectedAfterSecond = applyEnergyChange(expectedAfterFirst, secondConsumed, 0);

    expect(firstAfter.windPenaltyNextMove).toBe(0);
    expect(secondAfter.windPenaltyNextMove).toBe(0);
    expect(firstAfter.energy).toBe(expectedAfterFirst);
    expect(secondAfter.energy).toBe(expectedAfterSecond);
  });
});

describe('Energy thresholds - fringale', () => {
  it('recovers only at 0 energy with no movement', () => {
    // Arrange
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

    // Act
    const resolved = resolveMovement(state);
    const resolvedRider = resolved.riders.find(r => r.id === rider.id);

    // Assert
    expect(resolvedRider.position).toBe(1);
    expect(resolvedRider.energy).toBe(10);
    expect(resolved.lastMovement.type).toBe('recover');
    expect(resolved.lastMovement.distance).toBe(0);
    expect(resolvedRider.hand.some(card => card.id === moveCard.id)).toBe(true);
  });
});

describe('Energy thresholds - exhausted', () => {
  it('blocks attack/specialty but keeps terrain bonus', () => {
    // Arrange
    const course = makeCourse([
      TerrainType.MOUNTAIN,
      TerrainType.FLAT,
      TerrainType.FLAT
    ]);
    const state = createGameState({ courseLength: course.length });
    const attackCard = createAttackCard();
    const specialtyCard = createSpecialtyCard(TerrainType.MOUNTAIN);
    const moveCard = createMovementCard(2, 'Test', '#999999');
    const rider = {
      ...state.riders[0],
      type: 'climber',
      position: 1,
      energy: 10,
      hand: [moveCard],
      attackCards: [attackCard],
      specialtyCards: [specialtyCard]
    };

    const baseState = {
      ...state,
      course,
      courseLength: course.length,
      finishLine: course.length,
      riders: [rider],
      currentTeam: rider.team,
      selectedRiderId: rider.id,
      selectedCardId: null,
      turnPhase: TurnPhase.SELECT_CARD,
      gameLog: []
    };

    // Act
    const attackAttempt = selectCard(baseState, attackCard.id);
    const specialtyAttempt = selectSpecialty(
      {
        ...baseState,
        selectedCardId: moveCard.id,
        lastDiceRoll: { result: 1, isOne: false }
      },
      specialtyCard.id
    );
    const movement = calculateMovement({
      ...baseState,
      selectedCardId: moveCard.id,
      lastDiceRoll: { result: 1, isOne: false }
    });

    // Assert
    expect(attackAttempt.selectedCardId).toBe(null);
    expect(specialtyAttempt.selectedSpecialtyId).toBe(null);
    expect(movement).toBe(5);
  });
});

describe('Refuel rules', () => {
  it('applies after spend on the final refuel cell', () => {
    // Arrange
    const course = makeCourse(
      [TerrainType.FLAT, TerrainType.FLAT, TerrainType.FLAT, TerrainType.FLAT, TerrainType.FLAT],
      [4]
    );
    const state = createGameState({ courseLength: course.length });
    const moveCard = createMovementCard(2, 'Test', '#999999');
    const rider = {
      ...state.riders[0],
      type: 'versatile',
      position: 1,
      energy: 50,
      hand: [moveCard]
    };

    const resolveState = {
      ...state,
      course,
      courseLength: course.length,
      finishLine: course.length,
      riders: [rider],
      currentTeam: rider.team,
      selectedRiderId: rider.id,
      selectedCardId: moveCard.id,
      lastDiceRoll: { result: 1, isOne: false },
      turnPhase: TurnPhase.RESOLVE,
      ridersPlayedThisTurn: [],
      gameLog: []
    };

    // Act
    const resolved = resolveMovement(resolveState);
    const resolvedRider = resolved.riders.find(r => r.id === rider.id);
    const distance = resolvedRider.position - rider.position;
    const energyConsumed = calculateMovementConsumption({
      distance,
      terrain: TerrainType.FLAT,
      riderType: rider.type,
      usedAttack: false,
      usedSpecialty: false,
      isLeading: false
    });
    const energyRecovered = calculateRecovery({
      terrain: TerrainType.FLAT,
      distance: 0,
      isSheltered: false,
      inRefuelZone: true
    });
    const expectedEnergy = applyEnergyChange(rider.energy, energyConsumed, energyRecovered);

    // Assert
    expect(resolvedRider.position).toBe(4);
    expect(resolvedRider.energy).toBe(expectedEnergy);
  });

  it('stacks descent, refuel, and shelter recovery (cap 100)', () => {
    // Arrange
    const course = makeCourse(
      [
        TerrainType.DESCENT,
        TerrainType.FLAT,
        TerrainType.FLAT,
        TerrainType.FLAT,
        TerrainType.FLAT,
        TerrainType.FLAT,
        TerrainType.FLAT,
        TerrainType.FLAT
      ],
      [6]
    );
    const state = createGameState({ courseLength: course.length });
    const moveCard = createMovementCard(2, 'Test', '#999999');
    const rider = {
      ...state.riders[0],
      type: 'versatile',
      position: 1,
      energy: 95,
      hand: [moveCard]
    };
    const blocker = {
      ...state.riders[1],
      position: 7,
      arrivalOrder: 1
    };

    const resolveState = {
      ...state,
      course,
      courseLength: course.length,
      finishLine: course.length,
      riders: [rider, blocker],
      currentTeam: rider.team,
      selectedRiderId: rider.id,
      selectedCardId: moveCard.id,
      lastDiceRoll: { result: 1, isOne: false },
      turnPhase: TurnPhase.RESOLVE,
      ridersPlayedThisTurn: [],
      gameLog: []
    };

    // Act
    const resolved = resolveMovement(resolveState);
    const resolvedRider = resolved.riders.find(r => r.id === rider.id);
    const endTurn = applyEndOfTurnEffects(resolved);
    const endTurnRider = endTurn.riders.find(r => r.id === rider.id);

    // Assert
    expect(resolvedRider.position).toBe(6);
    expect(resolvedRider.energy).toBe(100);
    expect(endTurn.endTurnEffects.some(e => e.type === 'shelter' && e.riderId === rider.id)).toBe(true);
    expect(endTurnRider.energy).toBe(100);
  });
});
