/**
 * Stage race logic - v5.0
 * Handles points, jerseys, and fatigue between stages.
 * @module core/stage-race
 */

import {
  StageRaceConfig,
  StageRaceProfile,
  StageType,
  StageRecovery,
  getPointsForPosition,
  generateStageProgram,
  getStageTypeDistribution
} from '../config/race-presets.js';
import { EnergyConfig } from './energy.js';
import { CardType } from './rider.js';
import { generateCourseFromPreset } from './terrain.js';

/**
 * Classification identifiers
 */
export const StageClassification = {
  GENERAL: 'general',
  SPRINT: 'sprint',
  MOUNTAIN: 'mountain'
};

const CATEGORY_STAGE_TYPES = {
  [StageClassification.SPRINT]: [StageType.FLAT, StageType.SPRINT],
  [StageClassification.MOUNTAIN]: [StageType.HILLY, StageType.MOUNTAIN]
};

/**
 * Create a stage race state
 * @param {Object} options
 * @param {Array} options.riders - Riders participating
 * @param {number} options.numStages - Number of stages
 * @param {string} options.profile - Global profile
 * @param {number} options.stageLength - Length per stage
 * @returns {Object} Stage race state
 */
export function createStageRaceState({
  riders = [],
  numStages = StageRaceConfig.stageOptions[0],
  profile = StageRaceProfile.BALANCED,
  stageLength = 80
} = {}) {
  const stages = generateStageProgram(numStages, profile).map(stage => ({
    ...stage,
    length: stageLength
  }));

  const standings = createStandings(riders);
  const jerseys = getStageRaceLeaders(standings);

  return {
    numStages,
    profile,
    stageLength,
    stages,
    currentStageIndex: 0,
    standings,
    jerseys,
    history: []
  };
}

/**
 * Apply a stage's results to standings and jerseys
 * @param {Object} stageRaceState
 * @param {Array} stageResults - Ordered list of riders or rider IDs
 * @returns {Object} Updated stage race state
 */
export function applyStageResults(stageRaceState, stageResults = []) {
  if (!stageRaceState?.stages?.length) return stageRaceState;

  const stage = stageRaceState.stages[stageRaceState.currentStageIndex];
  if (!stage) return stageRaceState;

  const normalizedResults = normalizeStageResults(stageResults);
  if (normalizedResults.length === 0) return stageRaceState;

  const updatedStandings = {
    ...stageRaceState.standings,
    [StageClassification.GENERAL]: updateClassification(
      stageRaceState.standings[StageClassification.GENERAL],
      normalizedResults,
      getPointsForPosition
    )
  };

  if (CATEGORY_STAGE_TYPES[StageClassification.SPRINT].includes(stage.type)) {
    updatedStandings[StageClassification.SPRINT] = updateClassification(
      stageRaceState.standings[StageClassification.SPRINT],
      normalizedResults,
      getPointsForPosition
    );
  }

  if (CATEGORY_STAGE_TYPES[StageClassification.MOUNTAIN].includes(stage.type)) {
    updatedStandings[StageClassification.MOUNTAIN] = updateClassification(
      stageRaceState.standings[StageClassification.MOUNTAIN],
      normalizedResults,
      getPointsForPosition
    );
  }

  const jerseys = getStageRaceLeaders(updatedStandings);
  const stageSummary = buildStageSummary(stage, normalizedResults, jerseys, updatedStandings);

  return {
    ...stageRaceState,
    standings: updatedStandings,
    jerseys,
    history: [...stageRaceState.history, stageSummary]
  };
}

/**
 * Advance to the next stage
 * @param {Object} stageRaceState
 * @returns {Object} Updated stage race state
 */
export function advanceStage(stageRaceState) {
  const nextIndex = Math.min(
    stageRaceState.currentStageIndex + 1,
    stageRaceState.stages.length
  );

  return {
    ...stageRaceState,
    currentStageIndex: nextIndex
  };
}

/**
 * Check if a stage race is completed
 * @param {Object} stageRaceState
 * @returns {boolean}
 */
export function isStageRaceComplete(stageRaceState) {
  return stageRaceState.currentStageIndex >= stageRaceState.stages.length;
}

/**
 * Reset riders for a new stage while keeping fatigue and cards
 * @param {Array} riders
 * @returns {Array} Updated riders
 */
export function resetRidersForStage(riders = []) {
  return riders.map((rider, index) => ({
    ...rider,
    position: 0,
    hasFinished: false,
    finishPosition: null,
    hasFallenThisTurn: false,
    turnsToSkip: 0,
    arrivalOrder: index
  }));
}

/**
 * Apply recovery between stages (energy + fatigue cleanup)
 * @param {Array} riders
 * @param {Object} recoveryConfig
 * @returns {Array} Updated riders
 */
export function applyStageRecovery(riders = [], recoveryConfig = StageRecovery) {
  return riders.map(rider => recoverRiderBetweenStages(rider, recoveryConfig));
}

/**
 * Generate a course for a stage type
 * @param {string} stageType
 * @param {number} length
 * @returns {Array} Course array
 */
export function generateStageCourse(stageType, length = 80) {
  const distribution = getStageTypeDistribution(stageType);
  const preset = { distribution, defaultLength: length };
  return generateCourseFromPreset(preset, length);
}

/**
 * Get sorted rankings for a classification
 * @param {Object} classificationMap
 * @returns {Array} Sorted entries
 */
export function getClassificationRanking(classificationMap) {
  return Object.values(classificationMap).sort(compareClassificationEntries);
}

/**
 * Get jersey holders for each classification
 * @param {Object} standings
 * @returns {Object} Jerseys by color
 */
export function getStageRaceLeaders(standings) {
  const generalLeader = getClassificationLeader(standings[StageClassification.GENERAL]);
  const sprintLeader = getClassificationLeader(standings[StageClassification.SPRINT]);
  const mountainLeader = getClassificationLeader(standings[StageClassification.MOUNTAIN]);

  return {
    yellow: generalLeader?.riderId || null,
    green: sprintLeader?.riderId || null,
    polka: mountainLeader?.riderId || null
  };
}

function getClassificationLeader(classificationMap) {
  const entries = getClassificationRanking(classificationMap);
  if (entries.length === 0) return null;
  const hasPoints = entries.some(entry => entry.points > 0 || entry.stagePositions.length > 0);
  if (!hasPoints) return null;
  return entries[0];
}

function createStandings(riders) {
  return {
    [StageClassification.GENERAL]: createClassificationMap(riders),
    [StageClassification.SPRINT]: createClassificationMap(riders),
    [StageClassification.MOUNTAIN]: createClassificationMap(riders)
  };
}

function createClassificationMap(riders) {
  return riders.reduce((acc, rider) => {
    acc[rider.id] = createClassificationEntry(rider);
    return acc;
  }, {});
}

function createClassificationEntry(rider) {
  return {
    riderId: rider.id,
    name: rider.name || rider.id,
    team: rider.team || null,
    points: 0,
    stageWins: 0,
    totalPositions: 0,
    stagePositions: []
  };
}

function normalizeStageResults(stageResults) {
  return stageResults
    .map((result, index) => {
      if (!result) return null;
      if (typeof result === 'string') {
        return { riderId: result, position: index + 1 };
      }
      const riderId = result.id || result.riderId;
      if (!riderId) return null;
      return {
        riderId,
        name: result.name,
        team: result.team,
        position: index + 1
      };
    })
    .filter(Boolean);
}

function updateClassification(classification, stageResults, getPoints) {
  const updated = cloneClassification(classification);

  stageResults.forEach(result => {
    const entry = ensureClassificationEntry(updated, result);
    const points = getPoints(result.position);

    entry.points += points;
    entry.stageWins += result.position === 1 ? 1 : 0;
    entry.totalPositions += result.position;
    entry.stagePositions.push(result.position);
  });

  return updated;
}

function cloneClassification(classification) {
  return Object.fromEntries(
    Object.entries(classification).map(([id, entry]) => [
      id,
      {
        ...entry,
        stagePositions: [...entry.stagePositions]
      }
    ])
  );
}

function ensureClassificationEntry(classification, result) {
  if (!classification[result.riderId]) {
    classification[result.riderId] = {
      riderId: result.riderId,
      name: result.name || result.riderId,
      team: result.team || null,
      points: 0,
      stageWins: 0,
      totalPositions: 0,
      stagePositions: []
    };
  }
  return classification[result.riderId];
}

function compareClassificationEntries(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.stageWins !== a.stageWins) return b.stageWins - a.stageWins;
  if (a.totalPositions !== b.totalPositions) return a.totalPositions - b.totalPositions;
  return String(a.riderId).localeCompare(String(b.riderId));
}

function buildStageSummary(stage, results, jerseys, standings) {
  return {
    stageNumber: stage.number,
    stageType: stage.type,
    stageName: stage.name,
    results: results.map(result => ({
      riderId: result.riderId,
      name: result.name || standings[StageClassification.GENERAL][result.riderId]?.name,
      team: result.team || standings[StageClassification.GENERAL][result.riderId]?.team,
      position: result.position,
      points: getPointsForPosition(result.position)
    })),
    jerseys
  };
}

function recoverRiderBetweenStages(rider, recoveryConfig) {
  const targetEnergy = Math.round(EnergyConfig.maxEnergy * recoveryConfig.energyRecoveryRate);
  const recoveredEnergy = Math.max(rider.energy, targetEnergy);
  const newEnergy = Math.max(
    recoveryConfig.minEnergy,
    Math.min(EnergyConfig.maxEnergy, recoveredEnergy)
  );

  const { rider: clearedRider } = removeFatigueCards(rider, recoveryConfig.fatigueCardsRemoved);

  return {
    ...clearedRider,
    energy: newEnergy
  };
}

function removeFatigueCards(rider, count) {
  let remaining = count;
  const discard = [];

  for (const card of rider.discard) {
    if (remaining > 0 && card.type === CardType.FATIGUE) {
      remaining -= 1;
      continue;
    }
    discard.push(card);
  }

  let hand = rider.hand;
  if (remaining > 0 && rider.hand?.length) {
    hand = [];
    for (const card of rider.hand) {
      if (remaining > 0 && card.type === CardType.FATIGUE) {
        remaining -= 1;
        continue;
      }
      hand.push(card);
    }
  }

  return {
    rider: {
      ...rider,
      discard,
      hand
    },
    removed: count - remaining
  };
}
