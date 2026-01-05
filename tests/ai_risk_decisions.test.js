import { describe, it, expect } from 'vitest';
import { createAI, AIPersonality } from '../src/core/ai.js';
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

function buildState({ isCobbles = false, weather = RaceWeather.CLEAR, otherPosition = 50 } = {}) {
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
    hand: [makeCard('m2', 2), makeCard('m4', 4), makeCard('m5', 5)],
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
    raceEventState: { weather }
  };
}

function countAttacks({ state, trials, randomValues }) {
  const ai = createAI(AIDifficulty.HARD, AIPersonality.ATTACKER, {
    random: sequenceRandom(randomValues)
  });
  ai.analyzeRace(state, 'team_a');

  const rider = state.riders.find(r => r.id === 'r1');
  const role = ai.teamRoles.get(rider.id);
  const distanceToFinish = state.courseLength - rider.position;
  const riskCue = ai.getRiskCueReading(state, rider);

  let attacks = 0;
  for (let i = 0; i < trials; i += 1) {
    if (ai.shouldUseAttack(rider, state, distanceToFinish, role, riskCue)) {
      attacks += 1;
    }
  }
  return attacks;
}

describe('AI risk-aware attack behavior', () => {
  it('reduces attacks as risk increases', () => {
    const randomValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
    const trials = randomValues.length;

    const lowRisk = buildState({ otherPosition: 50 });
    const mediumRisk = buildState({ otherPosition: 48 });
    const highRisk = buildState({ isCobbles: true, otherPosition: 50 });

    const lowAttacks = countAttacks({ state: lowRisk, trials, randomValues });
    const mediumAttacks = countAttacks({ state: mediumRisk, trials, randomValues });
    const highAttacks = countAttacks({ state: highRisk, trials, randomValues });

    expect(lowAttacks).toBe(trials);
    expect(mediumAttacks).toBeLessThan(lowAttacks);
    expect(highAttacks).toBeLessThan(mediumAttacks);
  });
});
