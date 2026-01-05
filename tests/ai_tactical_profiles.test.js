import { describe, it, expect } from 'vitest';
import { createAI, AIPersonality, AITacticalProfile } from '../src/core/ai.js';
import { AIDifficulty } from '../src/core/teams.js';
import { TerrainType } from '../src/core/terrain.js';
import { RaceWeather } from '../src/core/race_weather.js';
import { RiderType } from '../src/core/rider.js';

function sequenceRandom(values) {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
}

function makeCard(id, value, name) {
  return { id, value, name: name || `Card ${value}` };
}

function buildAttackState({ isCobbles = false, otherPosition = 48 } = {}) {
  const courseLength = 60;
  const position = 50;
  const course = Array.from({ length: courseLength + 1 }, () => ({ terrain: TerrainType.FLAT }));
  course[position - 1].isCobbles = isCobbles;

  const rider = {
    id: 'r1',
    name: 'AI Rider',
    team: 'team_a',
    position,
    energy: 90,
    type: RiderType.ROULEUR,
    hand: [makeCard('m2', 2), makeCard('m4', 4)],
    attackCards: [makeCard('a6', 6, 'Attaque')],
    specialtyCards: [],
    hasFinished: false,
    windPenaltyNextMove: 0
  };

  const otherRider = {
    id: 'r2',
    name: 'Other',
    team: 'team_b',
    position: otherPosition,
    energy: 80,
    type: RiderType.ROULEUR,
    hand: [],
    attackCards: [],
    specialtyCards: [],
    hasFinished: false
  };

  return {
    riders: [rider, otherRider],
    courseLength,
    course,
    selectedRiderId: rider.id,
    raceEventState: { weather: RaceWeather.CLEAR }
  };
}

function countAttacks({ state, profile, randomValues }) {
  const ai = createAI(AIDifficulty.HARD, AIPersonality.ATTACKER, {
    aiProfile: profile,
    random: sequenceRandom(randomValues)
  });
  ai.analyzeRace(state, 'team_a');

  const rider = state.riders.find(r => r.id === 'r1');
  const role = ai.teamRoles.get(rider.id);
  const distanceToFinish = state.courseLength - rider.position;
  const riskCue = ai.getRiskCueReading(state, rider);

  let attacks = 0;
  for (let i = 0; i < randomValues.length; i += 1) {
    if (ai.shouldUseAttack(rider, state, distanceToFinish, role, riskCue)) {
      attacks += 1;
    }
  }
  return attacks;
}

function buildCobblesCardState(riderType) {
  const courseLength = 60;
  const position = 40;
  const course = Array.from({ length: courseLength + 1 }, () => ({ terrain: TerrainType.FLAT }));
  course[position - 1].isCobbles = true;

  const rider = {
    id: 'r1',
    name: 'AI Rider',
    team: 'team_a',
    position,
    energy: 80,
    type: riderType,
    hand: [makeCard('m2', 2), makeCard('m4', 4), makeCard('m6', 6)],
    attackCards: [],
    specialtyCards: [],
    hasFinished: false,
    windPenaltyNextMove: 0
  };

  const otherRider = {
    id: 'r2',
    name: 'Other',
    team: 'team_b',
    position: 30,
    energy: 80,
    type: RiderType.ROULEUR,
    hand: [],
    attackCards: [],
    specialtyCards: [],
    hasFinished: false
  };

  return {
    riders: [rider, otherRider],
    courseLength,
    course,
    selectedRiderId: rider.id,
    raceEventState: { weather: RaceWeather.CLEAR }
  };
}

function selectCardValue({ state, profile, randomValues }) {
  const ai = createAI(AIDifficulty.NORMAL, AIPersonality.BALANCED, {
    aiProfile: profile,
    random: sequenceRandom(randomValues)
  });
  ai.analyzeRace(state, 'team_a');

  const decision = ai.selectCard(state, 'team_a');
  const rider = state.riders.find(r => r.id === state.selectedRiderId);
  const card = rider.hand.find(c => c.id === decision.cardId);
  return card?.value ?? null;
}

describe('AI tactical profiles', () => {
  it('changes attack frequency under the same risk', () => {
    const randomValues = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
    const state = buildAttackState({ otherPosition: 48 });

    const conservative = countAttacks({
      state,
      profile: AITacticalProfile.CONSERVATEUR,
      randomValues
    });
    const balanced = countAttacks({
      state,
      profile: AITacticalProfile.EQUILIBRE,
      randomValues
    });
    const opportunist = countAttacks({
      state,
      profile: AITacticalProfile.OPPORTUNISTE,
      randomValues
    });

    expect(conservative).toBeLessThan(balanced);
    expect(opportunist).toBeGreaterThan(balanced);
  });

  it('alters cobbles positioning by rider type', () => {
    const climberState = buildCobblesCardState(RiderType.CLIMBER);
    const climberConservative = selectCardValue({
      state: climberState,
      profile: AITacticalProfile.CONSERVATEUR,
      randomValues: [0.8, 0.9]
    });
    const climberBalanced = selectCardValue({
      state: climberState,
      profile: AITacticalProfile.EQUILIBRE,
      randomValues: [0.8, 0.9]
    });

    expect(climberConservative).toBeLessThan(climberBalanced);

    const sprinterState = buildCobblesCardState(RiderType.SPRINTER);
    const sprinterOpportunist = selectCardValue({
      state: sprinterState,
      profile: AITacticalProfile.OPPORTUNISTE,
      randomValues: [0.8, 0.6]
    });
    const sprinterBalanced = selectCardValue({
      state: sprinterState,
      profile: AITacticalProfile.EQUILIBRE,
      randomValues: [0.8, 0.6]
    });

    expect(sprinterOpportunist).toBeGreaterThan(sprinterBalanced);
  });

  it('reduces aggression under high risk for every profile', () => {
    const randomValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
    const lowRiskState = buildAttackState({ otherPosition: 50 });
    const highRiskState = buildAttackState({ isCobbles: true, otherPosition: 50 });

    const profiles = [
      AITacticalProfile.CONSERVATEUR,
      AITacticalProfile.EQUILIBRE,
      AITacticalProfile.OPPORTUNISTE
    ];

    const results = profiles.map(profile => ({
      profile,
      low: countAttacks({ state: lowRiskState, profile, randomValues }),
      high: countAttacks({ state: highRiskState, profile, randomValues })
    }));

    results.forEach(result => {
      expect(result.high).toBeLessThan(result.low);
    });

    const highCounts = results.map(result => result.high);
    expect(highCounts[0]).toBeLessThan(highCounts[1]);
    expect(highCounts[1]).toBeLessThan(highCounts[2]);
  });
});
