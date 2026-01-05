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

function buildState({ riderType, isCobbles, energy = 80, otherPosition = 50 } = {}) {
  const courseLength = 60;
  const position = 50;
  const course = Array.from({ length: courseLength + 1 }, () => ({ terrain: TerrainType.FLAT }));
  course[position - 1].isCobbles = !!isCobbles;

  const rider = {
    id: 'r1',
    name: 'AI Rider',
    team: 'team_a',
    position,
    energy,
    type: riderType,
    hand: [makeCard('m2', 2), makeCard('m4', 4), makeCard('m6', 6)],
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

function countAttacks({ state, randomValues }) {
  const ai = createAI(AIDifficulty.HARD, AIPersonality.ATTACKER, {
    aiProfile: AITacticalProfile.EQUILIBRE,
    random: sequenceRandom(randomValues)
  });
  ai.analyzeRace(state, 'team_a');

  const rider = state.riders.find(r => r.id === 'r1');
  const role = ai.teamRoles.get(rider.id);
  const distanceToFinish = state.courseLength - rider.position;
  const riskCue = ai.getRiskCueReading(state, rider);
  const terrainContext = ai.getTerrainContext(state, rider);
  const isExposed = ai.isRiderExposed(state, rider);
  const isCobbles = ai.isRiderOnCobbles(state, rider);

  let attacks = 0;
  for (let i = 0; i < randomValues.length; i += 1) {
    if (ai.shouldUseAttack(
      rider,
      state,
      distanceToFinish,
      role,
      riskCue,
      terrainContext,
      isExposed,
      isCobbles
    )) {
      attacks += 1;
    }
  }
  return attacks;
}

function countLeadAcceptance({ state, randomValues }) {
  const ai = createAI(AIDifficulty.NORMAL, AIPersonality.BALANCED, {
    aiProfile: AITacticalProfile.EQUILIBRE,
    random: sequenceRandom(randomValues)
  });
  ai.analyzeRace(state, 'team_a');

  const rider = state.riders.find(r => r.id === 'r1');
  const riskCue = ai.getRiskCueReading(state, rider);

  let accepts = 0;
  for (let i = 0; i < randomValues.length; i += 1) {
    const decision = ai.riskAwareDecision('wind', {
      rider,
      state,
      riskCue,
      terrainContext: 'cobbles',
      isExposed: true,
      isCobbles: true
    });
    if (!decision.avoidWind) accepts += 1;
  }
  return accepts;
}

describe('AI cobbles strategy', () => {
  it('reduces climber attacks on cobbles vs flat', () => {
    const randomValues = [0.1, 0.2, 0.3, 0.4, 0.5];
    const flatState = buildState({ riderType: RiderType.CLIMBER, isCobbles: false, otherPosition: 50 });
    const cobblesState = buildState({ riderType: RiderType.CLIMBER, isCobbles: true, otherPosition: 50 });

    const flatAttacks = countAttacks({ state: flatState, randomValues });
    const cobblesAttacks = countAttacks({ state: cobblesState, randomValues });

    expect(cobblesAttacks).toBeLessThan(flatAttacks);
  });

  it('lets rouleurs accept wind more often on cobbles', () => {
    const randomValues = [0.1, 0.2, 0.3, 0.7, 0.8, 0.9];
    const rouleurState = buildState({ riderType: RiderType.ROULEUR, isCobbles: true, otherPosition: 45 });
    const climberState = buildState({ riderType: RiderType.CLIMBER, isCobbles: true, otherPosition: 45 });

    const rouleurAccepts = countLeadAcceptance({ state: rouleurState, randomValues });
    const climberAccepts = countLeadAcceptance({ state: climberState, randomValues });

    expect(rouleurAccepts).toBeGreaterThan(climberAccepts);
  });

  it('blocks attacks on cobbles when risk is high', () => {
    const state = buildState({ riderType: RiderType.ROULEUR, isCobbles: true, otherPosition: 50 });
    const ai = createAI(AIDifficulty.HARD, AIPersonality.ATTACKER, {
      aiProfile: AITacticalProfile.EQUILIBRE,
      random: sequenceRandom([0.2])
    });
    ai.analyzeRace(state, 'team_a');

    const rider = state.riders.find(r => r.id === 'r1');
    const role = ai.teamRoles.get(rider.id);
    const distanceToFinish = state.courseLength - rider.position;
    const riskCue = ai.getRiskCueReading(state, rider);
    const terrainContext = ai.getTerrainContext(state, rider);
    const isExposed = ai.isRiderExposed(state, rider);
    const isCobbles = ai.isRiderOnCobbles(state, rider);

    const shouldAttack = ai.shouldUseAttack(
      rider,
      state,
      distanceToFinish,
      role,
      riskCue,
      terrainContext,
      isExposed,
      isCobbles
    );

    expect(riskCue.level).toBe('high');
    expect(shouldAttack).toBe(false);
  });
});
