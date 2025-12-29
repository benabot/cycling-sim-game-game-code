/**
 * Main game engine - v4.0 Multi-teams + AI
 * @module core/game_engine
 */

import { roll1D6, rollFallTest } from './dice.js';
import { TerrainType, TerrainConfig, DescentRules, getTerrainBonus, generateCourse, generateCourseFromPreset, hasAspiration, findSummitPosition, isRefuelZone } from './terrain.js';
import {
  RaceEventDefinitions,
  RaceEventId,
  rollRaceEvent,
  rollPunctureOnCobbleStep,
  attachRaceEvent,
  applyRaceEventMovement,
  getRaceEventEnergyPenalty,
  getRaceEventCardPenalty,
  tickRaceEvent,
  formatRaceEventLog
} from './race_events.js';
import {
  RaceWeather,
  rollRaceWeather,
  applyWindPenaltyModifier,
  applyShelterRecoveryModifier
} from './race_weather.js';
import { 
  createRider, createRiderFromDraft, createTeamRiders, RiderConfig, CardType, RiderType,
  playCard, playSpecialtyCard, addFatigueCard,
  moveRider, getAvailableCards, getHandStats, createMovementCard
} from './rider.js';
import {
  EnergyConfig,
  getEnergyStatus,
  getEnergyEffects,
  isAdaptedToTerrain,
  calculateMovementConsumption,
  calculateRecovery,
  applyEnergyChange,
  getEnergyColor,
  getEnergyLabel
} from './energy.js';
import {
  TeamId,
  TeamConfigs,
  PlayerType,
  getTeamIds,
  getTeamConfig,
  isAITeam,
  getNextTeam
} from './teams.js';
import {
  createStageRaceState,
  applyStageResults,
  advanceStage,
  isStageRaceComplete,
  applyStageRecovery,
  resetRidersForStage,
  generateStageCourse,
  StageClassification,
  getClassificationRanking
} from './stage-race.js';
import { getClassicPreset } from '../config/race-presets.js';

/**
 * Constants
 */
const MAX_RIDERS_PER_CELL = 4;
const WIND_PENALTY_DEFAULT = 3;
const WIND_PENALTY_ROULEUR = 5;

/**
 * Game phases
 */
export const GamePhase = {
  SETUP: 'setup',
  PLAYING: 'playing',
  LAST_TURN: 'last_turn',
  FINISHED: 'finished'
};

/**
 * Turn phases
 */
export const TurnPhase = {
  SELECT_RIDER: 'select_rider',
  SELECT_CARD: 'select_card',
  ROLL_DICE: 'roll_dice',
  SELECT_SPECIALTY: 'select_specialty',
  RESOLVE: 'resolve',
  END_TURN_EFFECTS: 'end_turn_effects',
  NEXT_PLAYER: 'next_player'
};

/**
 * Team configuration - v4.0 uses teams.js, these are aliases for compatibility
 */
export const Teams = TeamId;
export const TeamConfig = TeamConfigs;

/**
 * Create riders for multiple teams
 * @param {string[]} teamIds - Array of team IDs
 * @param {Object} playersConfig - Optional players configuration with custom names
 * @returns {Array} Array of riders
 */
export function createRidersForTeams(teamIds, playersConfig = null, draftRosters = null) {
  const riders = [];
  teamIds.forEach(teamId => {
    const config = getTeamConfig(teamId);
    const playerConfig = playersConfig?.find(p => p.teamId === teamId);
    const customNames = playerConfig?.riderNames || null;
    const roster = draftRosters?.[teamId] || null;

    if (roster && roster.length > 0) {
      const customNameByRole = customNames
        ? {
            climber: customNames[0],
            puncher: customNames[1],
            rouleur: customNames[2],
            sprinter: customNames[3],
            versatile: customNames[4]
          }
        : null;

      roster.forEach(draftRider => {
        const customName = customNameByRole?.[draftRider.role] || null;
        riders.push(createRiderFromDraft(draftRider, teamId, customName));
      });
      return;
    }

    riders.push(...createTeamRiders(teamId, config.prefix, customNames));
  });
  return riders;
}

/**
 * Create riders for two teams (legacy support)
 * @returns {Array} Array of 8 riders (4 per team)
 */
export function createTwoTeamsRiders() {
  return createRidersForTeams([TeamId.TEAM_A, TeamId.TEAM_B]);
}

/**
 * Create initial game state
 * @param {Object} options - Game options
 * @param {Object} options.gameConfig - Full game configuration from setup
 * @param {number} options.courseLength - Course length (default 80)
 * @returns {Object} Initial game state
 */
export function createGameState(options = {}) {
  const {
    gameConfig = null,
    courseLength = 80
  } = options;
  
  // Use gameConfig if provided, otherwise legacy 2-team mode
  const baseCourseLength = gameConfig?.courseLength || courseLength;
  const teamIds = gameConfig?.players?.map(p => p.teamId) || [TeamId.TEAM_A, TeamId.TEAM_B];
  const players = gameConfig?.players || [
    { teamId: TeamId.TEAM_A, playerType: PlayerType.HUMAN },
    { teamId: TeamId.TEAM_B, playerType: PlayerType.HUMAN }
  ];
  const raceMode = gameConfig?.raceMode || (gameConfig?.stageRace ? 'STAGE_RACE' : 'CLASSIC');
  const draftRosters = gameConfig?.draftRosters || null;
  
  let riders = createRidersForTeams(teamIds, players, draftRosters);
  const stageRaceConfig = gameConfig?.stageRace || null;
  let stageRace = null;
  let effectiveCourseLength = baseCourseLength;
  let course = null;
  
  if (stageRaceConfig) {
    const stageLength = stageRaceConfig.stageLength || baseCourseLength;
    stageRace = createStageRaceState({
      riders,
      numStages: stageRaceConfig.numStages,
      profile: stageRaceConfig.profile,
      stageLength
    });
    const currentStage = stageRace.stages[stageRace.currentStageIndex];
    effectiveCourseLength = stageLength;
    course = generateStageCourse(currentStage.type, stageLength);
  } else if (gameConfig?.classicId) {
    const classicPreset = getClassicPreset(gameConfig.classicId);
    if (classicPreset) {
      course = generateCourseFromPreset({
        ...classicPreset,
        presetType: classicPreset.id
      }, effectiveCourseLength);
    } else {
      course = generateCourse(effectiveCourseLength);
    }
  } else {
    course = generateCourse(effectiveCourseLength);
  }

  // All riders start at position 0 with arrival order
  riders = riders.map((r, index) => ({ 
    ...r, 
    position: 0,
    arrivalOrder: index // First riders are "rightmost" (arrived first)
  }));
  
  // Random starting team from available teams
  const startingTeam = teamIds[Math.floor(Math.random() * teamIds.length)];
  
  const weather = rollRaceWeather({ presetWeather: gameConfig?.weather, rng: gameConfig?.weatherRng });

  return {
    // Game configuration
    courseLength: effectiveCourseLength,
    finishLine: effectiveCourseLength,
    course,
    
    // v4.0: Multi-team configuration
    gameConfig,
    raceMode,
    teamIds,
    players,
    numTeams: teamIds.length,
    stageRace,
    raceEventState: {
      cooldownTurns: 0,
      weather,
      lastCobblePunctureTurn: null
    },
    
    // Riders
    riders,
    
    // Global arrival counter (increments each time a rider arrives on a cell)
    arrivalCounter: riders.length,
    
    // Game state
    phase: GamePhase.PLAYING,
    turnPhase: TurnPhase.SELECT_RIDER,
    currentTurn: 1,
    
    // Player turn management
    currentTeam: startingTeam,
    ridersPlayedThisTurn: [],
    
    // Selected rider and cards for current action
    selectedRiderId: null,
    selectedCardId: null,
    selectedSpecialtyId: null,
    
    // Last turn tracking
    isLastTurn: false,
    firstFinisher: null,
    
    // Action state
    lastDiceRoll: null,
    lastMovement: null,
    
    // End of turn effects (for animations)
    endTurnEffects: [],
    
    // Log
    gameLog: [],
    
    // Final rankings
    rankings: [],
    winningTeam: null
  };
}

/**
 * Get terrain at a specific position
 * Note: Position is 1-based (position 1 = first course cell = course[0])
 * Position 0 is the starting line (flat terrain)
 */
export function getTerrainAt(state, position) {
  if (position >= state.courseLength) {
    return TerrainType.SPRINT;
  }
  if (position <= 0) {
    return TerrainType.FLAT;
  }
  // Position 1 = course[0], position N = course[N-1]
  const courseIndex = position - 1;
  return state.course[courseIndex]?.terrain || TerrainType.FLAT;
}

function isCobbleCell(state, position) {
  if (position <= 0 || position > state.courseLength) return false;
  const courseIndex = position - 1;
  return !!state.course[courseIndex]?.isCobbles;
}

/**
 * Get the next team in rotation
 * @param {string} team - Current team
 * @param {Object} state - Game state (optional, for multi-team)
 * @returns {string} Next team ID
 */
export function getOtherTeam(team, state = null) {
  if (state?.teamIds && state.teamIds.length > 2) {
    return getNextTeam(team, state.teamIds);
  }
  // Legacy 2-team fallback
  return team === Teams.TEAM_A ? Teams.TEAM_B : Teams.TEAM_A;
}

/**
 * Check if current team is AI controlled
 * @param {Object} state - Game state
 * @returns {boolean} True if AI team
 */
export function isCurrentTeamAI(state) {
  if (!state.players) return false;
  const player = state.players.find(p => p.teamId === state.currentTeam);
  return player?.playerType === PlayerType.AI;
}

/**
 * Get AI difficulty for current team
 * @param {Object} state - Game state
 * @returns {string|null} AI difficulty or null if human
 */
export function getCurrentTeamAIDifficulty(state) {
  if (!state.players) return null;
  const player = state.players.find(p => p.teamId === state.currentTeam);
  return player?.playerType === PlayerType.AI ? player.difficulty : null;
}

/**
 * Get riders at a specific position (sorted by arrival order - first arrived = rightmost)
 */
export function getRidersAtPosition(state, position) {
  return state.riders
    .filter(r => r.position === position && !r.hasFinished)
    .sort((a, b) => a.arrivalOrder - b.arrivalOrder); // Lower arrivalOrder = arrived first = rightmost
}

/**
 * Count riders at a position
 */
export function countRidersAtPosition(state, position) {
  return state.riders.filter(r => r.position === position && !r.hasFinished).length;
}

/**
 * Find first available position at or before target position
 * (handles max 4 riders per cell rule)
 */
export function findAvailablePosition(state, targetPosition) {
  let position = targetPosition;
  
  while (position >= 0 && countRidersAtPosition(state, position) >= MAX_RIDERS_PER_CELL) {
    position--;
  }
  
  return Math.max(0, position);
}

/**
 * Get the leader (rightmost rider) at a position
 * The leader is the one who arrived first (lowest arrivalOrder)
 */
export function getLeaderAtPosition(state, position) {
  const riders = getRidersAtPosition(state, position);
  return riders.length > 0 ? riders[0] : null;
}

/**
 * Get available riders for a team
 */
export function getAvailableRiders(state, team) {
  return state.riders.filter(r => 
    r.team === team && 
    !state.ridersPlayedThisTurn.includes(r.id) &&
    !r.hasFinished &&
    !(r.turnsToSkip > 0)
  );
}

/**
 * Check if a team has available riders
 */
export function teamHasAvailableRiders(state, team) {
  return getAvailableRiders(state, team).length > 0;
}

/**
 * Start a new turn
 */
export function startTurn(state) {
  const startingTeam = state.currentTurn === 1 
    ? state.currentTeam 
    : getOtherTeam(state.lastTurnStarter || Teams.TEAM_A);
  
  const turnHeader = state.isLastTurn 
    ? `\n══════════ 🏁 DERNIER TOUR (Tour ${state.currentTurn}) ══════════`
    : `\n────────── Tour ${state.currentTurn} ──────────`;
  
  // Decrement turnsToSkip and reset hasFallenThisTurn
  let updatedRiders = state.riders.map(rider => {
    let updated = rider;
    
    // Decrement turns to skip
    if (updated.turnsToSkip > 0) {
      updated = {
        ...updated,
        turnsToSkip: updated.turnsToSkip - 1
      };
    }
    
    // Reset fall flag
    if (updated.hasFallenThisTurn) {
      updated = {
        ...updated,
        hasFallenThisTurn: false
      };
    }
    
    return updated;
  });
  
  // Log riders skipping this turn
  const skippingRiders = updatedRiders.filter(r => r.turnsToSkip > 0);
  let extraLogs = [];
  if (skippingRiders.length > 0) {
    extraLogs = skippingRiders.map(r => `🤕 ${r.name} récupère de sa chute (passe ce tour)`);
  }
  
  return {
    ...state,
    riders: updatedRiders,
    currentTeam: startingTeam,
    lastTurnStarter: startingTeam,
    ridersPlayedThisTurn: [],
    selectedRiderId: null,
    selectedCardId: null,
    selectedSpecialtyId: null,
    turnPhase: TurnPhase.SELECT_RIDER,
    endTurnEffects: [],
    gameLog: [
      ...state.gameLog, 
      turnHeader,
      ...extraLogs,
      `🎮 ${TeamConfig[startingTeam].playerName} (${TeamConfig[startingTeam].shortName}) commence`
    ]
  };
}

/**
 * Get current rider
 */
export function getCurrentRider(state) {
  if (!state.selectedRiderId) return null;
  return state.riders.find(r => r.id === state.selectedRiderId);
}

/**
 * Select a rider to play
 */
export function selectRider(state, riderId) {
  const rider = state.riders.find(r => r.id === riderId);
  
  if (!rider) return state;
  if (rider.team !== state.currentTeam) return state;
  if (state.ridersPlayedThisTurn.includes(riderId)) return state;
  if (rider.hasFinished) return state;
  
  return {
    ...state,
    selectedRiderId: riderId,
    selectedCardId: null,
    selectedSpecialtyId: null,
    turnPhase: TurnPhase.SELECT_CARD,
    lastDiceRoll: null,
    lastMovement: null
  };
}

/**
 * Deselect current rider
 */
export function deselectRider(state) {
  if (state.turnPhase !== TurnPhase.SELECT_CARD) return state;
  
  return {
    ...state,
    selectedRiderId: null,
    selectedCardId: null,
    turnPhase: TurnPhase.SELECT_RIDER
  };
}

/**
 * Select a card to play
 */
export function selectCard(state, cardId) {
  const rider = getCurrentRider(state);
  if (!rider) return state;
  
  // Verify card exists in rider's hand or attack cards
  const cardInHand = rider.hand.find(c => c.id === cardId);
  const cardInAttack = rider.attackCards.find(c => c.id === cardId);
  
  if (!cardInHand && !cardInAttack) return state;
  
  // v3.3: Check energy restrictions for attack cards
  if (cardInAttack) {
    const energyEffects = getEnergyEffects(rider.energy);
    if (!energyEffects.canUseAttack) {
      // Cannot use attack card - energy too low
      return {
        ...state,
        gameLog: [
          ...state.gameLog,
          `⚡ ${rider.name} est trop fatigué pour attaquer (énergie: ${rider.energy}%)`
        ]
      };
    }
  }
  
  return {
    ...state,
    selectedCardId: cardId,
    turnPhase: TurnPhase.ROLL_DICE
  };
}

/**
 * Deselect current card
 */
export function deselectCard(state) {
  if (state.turnPhase !== TurnPhase.ROLL_DICE) return state;
  
  return {
    ...state,
    selectedCardId: null,
    turnPhase: TurnPhase.SELECT_CARD
  };
}

/**
 * Roll dice
 */
export function rollDice(state) {
  const rider = getCurrentRider(state);
  if (!rider || !state.selectedCardId) return state;
  
  const terrain = getTerrainAt(state, rider.position);
  const diceRoll = roll1D6();
  
  let newState = {
    ...state,
    lastDiceRoll: diceRoll
  };
  
  // Check for fall in descent on 1
  if (terrain === TerrainType.DESCENT && diceRoll.isOne) {
    const fallTest = rollFallTest();
    newState.gameLog = [
      ...newState.gameLog,
      `🎲 ${rider.name} fait 1 en descente → Test de chute: ${fallTest.roll}`
    ];
    
    if (fallTest.hasFallen) {
      // Apply fall - find available position
      const fallPosition = findAvailablePosition(newState, Math.max(0, rider.position - DescentRules.fallPenalty));
      
      let updatedRider = {
        ...rider,
        position: fallPosition,
        arrivalOrder: newState.arrivalCounter++,
        hasFallenThisTurn: true,
        turnsToSkip: 1  // Skip next turn
      };
      // Add fatigue cards
      updatedRider = addFatigueCard(updatedRider, 1);
      updatedRider = addFatigueCard(updatedRider, 1);
      
      newState.riders = state.riders.map(r => 
        r.id === rider.id ? updatedRider : r
      );
      newState.gameLog = [
        ...newState.gameLog,
        `💥 ${rider.name} CHUTE! Recule à la case ${fallPosition}, +2 cartes fatigue, passe le prochain tour`
      ];
      newState.lastMovement = { type: 'fall', distance: -DescentRules.fallPenalty };
      newState.turnPhase = TurnPhase.RESOLVE;
      
      return newState;
    } else {
      newState.gameLog = [
        ...newState.gameLog,
        `😅 ${rider.name} évite la chute!`
      ];
    }
  }
  
  // Check if specialty can be used
  const availableCards = getAvailableCards(rider, terrain);
  if (availableCards.canUseSpecialty && availableCards.specialty.length > 0) {
    newState.turnPhase = TurnPhase.SELECT_SPECIALTY;
  } else {
    newState.turnPhase = TurnPhase.RESOLVE;
  }
  
  return newState;
}

/**
 * Select specialty card (optional)
 */
export function selectSpecialty(state, cardId) {
  if (cardId === null) {
    // Skip specialty
    return {
      ...state,
      selectedSpecialtyId: null,
      turnPhase: TurnPhase.RESOLVE
    };
  }
  
  const rider = getCurrentRider(state);
  if (!rider) return state;
  
  const specialtyCard = rider.specialtyCards.find(c => c.id === cardId);
  if (!specialtyCard) return state;
  
  // v3.3: Check energy restrictions for specialty cards
  const energyEffects = getEnergyEffects(rider.energy);
  if (!energyEffects.canUseSpecialty) {
    return {
      ...state,
      selectedSpecialtyId: null,
      turnPhase: TurnPhase.RESOLVE,
      gameLog: [
        ...state.gameLog,
        `⚡ ${rider.name} est trop fatigué pour utiliser sa spécialité (énergie: ${rider.energy}%)`
      ]
    };
  }
  
  return {
    ...state,
    selectedSpecialtyId: cardId,
    turnPhase: TurnPhase.RESOLVE
  };
}

/**
 * Calculate movement for current rider (v3.3 with energy effects)
 */
export function calculateMovement(state) {
  const rider = getCurrentRider(state);
  if (!rider || !state.lastDiceRoll || !state.selectedCardId) return 0;
  
  if (getEnergyStatus(rider.energy) === 'fringale') return 0;

  const terrain = getTerrainAt(state, rider.position);
  const energyEffects = getEnergyEffects(rider.energy);
  
  // Base: dice
  let movement = state.lastDiceRoll.result;
  
  // Find selected card
  const cardInHand = rider.hand.find(c => c.id === state.selectedCardId);
  const cardInAttack = rider.attackCards.find(c => c.id === state.selectedCardId);
  const selectedCard = cardInHand || cardInAttack;
  
  if (selectedCard) {
    let cardValue = selectedCard.value;
    
    // v3.3: Apply energy penalties to attack cards
    if (cardInAttack && energyEffects.attackPenalty !== null) {
      cardValue += energyEffects.attackPenalty; // Penalty is negative or 0
    }
    
    movement += cardValue;
  }
  
  // Terrain bonus (v3.3: disabled if exhausted/fringale)
  if (!energyEffects.bonusDisabled) {
    movement += getTerrainBonus(terrain, rider.type);
  }
  
  // Specialty card bonus
  if (state.selectedSpecialtyId) {
    const specialtyCard = rider.specialtyCards.find(c => c.id === state.selectedSpecialtyId);
    if (specialtyCard) {
      let specialtyValue = specialtyCard.value;
      
      // v3.3: Apply energy penalties to specialty cards
      if (energyEffects.specialtyPenalty !== null) {
        specialtyValue += energyEffects.specialtyPenalty;
      }
      
      movement += specialtyValue;
    }
  }
  
  // Descent minimum speed
  if (terrain === TerrainType.DESCENT) {
    movement = Math.max(movement, DescentRules.minSpeed);
  }
  
  // v3.3: Fringale max movement
  if (energyEffects.maxMovement !== null) {
    movement = Math.min(movement, energyEffects.maxMovement);
  }

  movement = applyRaceEventMovement(movement, rider);

  return Math.max(1, movement);
}

/**
 * Calculate preview positions for UI display
 * Shows where the rider will end up with and without specialty card
 * @param {Object} state - Current game state
 * @returns {Object} Preview data with positions
 */
export function calculatePreviewPositions(state) {
  const rider = getCurrentRider(state);
  if (!rider || !state.lastDiceRoll || !state.selectedCardId) {
    return null;
  }

  if (getEnergyStatus(rider.energy) === 'fringale') {
    return null;
  }
  
  const terrain = getTerrainAt(state, rider.position);
  
  // Base movement: dice + card + terrain bonus
  let baseMovement = state.lastDiceRoll.result;
  
  const cardInHand = rider.hand.find(c => c.id === state.selectedCardId);
  const cardInAttack = rider.attackCards.find(c => c.id === state.selectedCardId);
  const selectedCard = cardInHand || cardInAttack;
  
  if (selectedCard) {
    baseMovement += selectedCard.value;
  }
  
  baseMovement += getTerrainBonus(terrain, rider.type);
  
  // Descent minimum speed
  if (terrain === TerrainType.DESCENT) {
    baseMovement = Math.max(baseMovement, DescentRules.minSpeed);
  }

  const movementWithoutEvent = Math.max(1, applyRaceEventMovement(baseMovement, rider));
  const movementWithEvent = Math.max(1, applyRaceEventMovement(baseMovement + 2, rider));
  
  // Calculate position without specialty
  let targetWithoutSpecialty = rider.position + movementWithoutEvent;

  const crossingFinishWithout = targetWithoutSpecialty >= state.finishLine;
  // Find available position (cell capacity)
  const finalWithoutSpecialty = crossingFinishWithout
    ? targetWithoutSpecialty
    : findAvailablePosition(state, targetWithoutSpecialty);
  
  // Calculate position with specialty (+2)
  let targetWithSpecialty = rider.position + movementWithEvent;

  const crossingFinishWith = targetWithSpecialty >= state.finishLine;
  const finalWithSpecialty = crossingFinishWith
    ? targetWithSpecialty
    : findAvailablePosition(state, targetWithSpecialty);
  
  // Check if specialty can be used
  const canUseSpecialty = rider.specialtyCards.length > 0 && (
    rider.type === 'versatile' ||
    (rider.type === 'climber' && terrain === TerrainType.MOUNTAIN) ||
    (rider.type === 'puncher' && terrain === TerrainType.HILL) ||
    (rider.type === 'rouleur' && terrain === TerrainType.FLAT) ||
    (rider.type === 'sprinter' && terrain === TerrainType.SPRINT)
  );
  
  return {
    startPosition: rider.position,
    movementWithout: movementWithoutEvent,
    movementWith: movementWithEvent,
    positionWithout: finalWithoutSpecialty,
    positionWith: finalWithSpecialty,
    summitStopWithout: false,
    summitStopWith: false,
    crossingFinishWithout,
    crossingFinishWith,
    canUseSpecialty,
    hasSpecialtyCards: rider.specialtyCards.length > 0
  };
}

/**
 * Resolve movement and apply effects (v3.3 with energy)
 */
export function resolveMovement(state) {
  const rider = getCurrentRider(state);
  if (!rider) return state;
  
  // Skip if fallen this turn
  if (rider.hasFallenThisTurn) {
    return moveToNextPlayer({
      ...state,
      ridersPlayedThisTurn: [...state.ridersPlayedThisTurn, rider.id]
    });
  }

  if (getEnergyStatus(rider.energy) === 'fringale') {
    const recovered = EnergyConfig.fringaleRecovery ?? 10;
    const newEnergy = applyEnergyChange(rider.energy, 0, recovered);
    const updatedRiders = state.riders.map(r =>
      r.id === rider.id ? { ...r, energy: newEnergy } : r
    );

    const recoverState = {
      ...state,
      riders: updatedRiders,
      selectedCardId: null,
      selectedSpecialtyId: null,
      lastDiceRoll: null,
      lastMovement: { type: 'recover', distance: 0, energyDelta: newEnergy - rider.energy },
      ridersPlayedThisTurn: [...state.ridersPlayedThisTurn, rider.id],
      gameLog: [...state.gameLog, `⚡ ${rider.name} récupère (+${newEnergy - rider.energy} énergie)`]
    };

    return moveToNextPlayer(recoverState);
  }
  
  const movement = calculateMovement(state);
  let targetPosition = rider.position + movement;
  const terrain = getTerrainAt(state, rider.position);
  
  // Check if crossing finish
  const crossingFinish = targetPosition >= state.finishLine && !rider.hasFinished;
  
  // If not crossing finish, check for cell capacity
  let newPosition = targetPosition;
  if (!crossingFinish) {
    newPosition = findAvailablePosition(state, targetPosition);
  }
  
  // Calculate actual distance moved
  const actualDistance = newPosition - rider.position;

  const summitPosition = findSummitPosition(
    state.course,
    rider.position,
    crossingFinish ? targetPosition : newPosition
  );
  const summitBonus = summitPosition !== null && rider.type === 'climber' ? 1 : 0;

  const raceEventState = state.raceEventState || {
    cooldownTurns: 0,
    weather: RaceWeather.CLEAR,
    lastCobblePunctureTurn: null
  };
  const cobbleRng = raceEventState.rng || Math.random;
  const cobblePunctureBlocked =
    raceEventState.lastCobblePunctureTurn === state.currentTurn ||
    rider.lastCobblePunctureTurn === state.currentTurn;
  const isSheltered = countRidersAtPosition(state, rider.position) > 1;
  let cobblePunctureTriggered = false;

  if (!cobblePunctureBlocked && !rider.raceEvent) {
    const maxPos = Math.min(newPosition, state.courseLength);
    for (let pos = rider.position + 1; pos <= maxPos; pos++) {
      if (!isCobbleCell(state, pos)) continue;
      if (rollPunctureOnCobbleStep(rider, {
        energy: rider.energy,
        isSheltered,
        weather: raceEventState.weather,
        rng: cobbleRng
      })) {
        cobblePunctureTriggered = true;
        break;
      }
    }
  }

  // Energy check before committing the action
  const usedAttack = rider.attackCards.some(c => c.id === state.selectedCardId);
  const usedSpecialty = !!state.selectedSpecialtyId;
  const windPenalty = rider.windPenaltyNextMove || 0;
  const eventPenalty = getRaceEventEnergyPenalty(rider);
  const energyConsumed = Math.max(0, calculateMovementConsumption({
    distance: actualDistance,
    terrain,
    riderType: rider.type,
    usedAttack,
    usedSpecialty,
    isLeading: false // Determined at end of turn
  }) + windPenalty + eventPenalty - summitBonus);

  if (energyConsumed > rider.energy) {
    return {
      ...state,
      selectedCardId: null,
      selectedSpecialtyId: null,
      lastDiceRoll: null,
      lastMovement: { type: 'invalid', energyRequired: energyConsumed },
      turnPhase: TurnPhase.SELECT_CARD,
      gameLog: [
        ...state.gameLog,
        `⚡ ${rider.name} manque d'énergie (${energyConsumed} requis)`
      ]
    };
  }
  
  // Play the selected card
  let updatedRider = rider;
  const { rider: riderAfterCard, card: playedCard } = playCard(rider, state.selectedCardId);
  updatedRider = riderAfterCard;
  
  // Play specialty card if selected
  if (usedSpecialty) {
    const { rider: riderAfterSpecialty } = playSpecialtyCard(updatedRider, state.selectedSpecialtyId);
    updatedRider = riderAfterSpecialty;
  }
  
  // v3.3: Calculate energy recovery (descent only during movement)
  const onRefuelZone = isRefuelZone(state.course, newPosition);
  const energyRecovered = calculateRecovery({
    terrain,
    distance: terrain === 'descent' ? actualDistance : 0,
    isSheltered: false, // Determined at end of turn
    inRefuelZone: onRefuelZone
  });
  
  // v3.3: Apply energy change
  const newEnergy = applyEnergyChange(updatedRider.energy, energyConsumed, energyRecovered);
  
  // Update arrival order and position
  let newArrivalCounter = state.arrivalCounter;
  updatedRider = {
    ...updatedRider,
    position: crossingFinish ? targetPosition : newPosition,
    arrivalOrder: newArrivalCounter++,
    hasFinished: crossingFinish,
    finishPosition: crossingFinish ? targetPosition : null,
    energy: newEnergy, // v3.3
    windPenaltyNextMove: 0
  };

  let updatedRaceEventState = raceEventState;
  const extraLogs = [];
  if (cobblePunctureTriggered) {
    updatedRider = attachRaceEvent(
      updatedRider,
      RaceEventDefinitions[RaceEventId.PUNCTURE],
      { turns: 2, source: 'cobbles' }
    );
    updatedRider.lastCobblePunctureTurn = state.currentTurn;
    updatedRaceEventState = {
      ...raceEventState,
      lastCobblePunctureTurn: state.currentTurn
    };
    extraLogs.push(`🛞 Crevaison (pavés) — ${updatedRider.name}`);
  }
  
  // Update riders array
  let updatedRiders = state.riders.map(r => 
    r.id === rider.id ? updatedRider : r
  );
  
  // Build log message
  let logMessage = `🚴 ${rider.name} joue ${playedCard?.name || 'carte'} (+${playedCard?.value || 0})`;
  if (usedSpecialty) {
    logMessage += ` + Spécialité (+2)`;
  }
  logMessage += ` + 🎲${state.lastDiceRoll.result} → ${movement} cases`;
  
  // v3.3: Add energy info
  const energyDelta = energyRecovered - energyConsumed;
  if (energyDelta !== 0) {
    logMessage += ` | ⚡${energyDelta > 0 ? '+' : ''}${energyDelta}`;
  }
  
  if (!crossingFinish && newPosition !== targetPosition) {
    logMessage += ` (case pleine, arrêt case ${newPosition})`;
  } else {
    logMessage += ` (case ${newPosition})`;
  }
  
  let newState = {
    ...state,
    riders: updatedRiders,
    arrivalCounter: newArrivalCounter,
    lastMovement: { type: 'move', distance: movement, newPosition, energyDelta },
    ridersPlayedThisTurn: [...state.ridersPlayedThisTurn, rider.id],
    raceEventState: updatedRaceEventState,
    gameLog: [...state.gameLog, logMessage, ...extraLogs]
  };
  
  // Check if last turn should start
  if (crossingFinish && !state.isLastTurn && !state.firstFinisher) {
    newState = {
      ...newState,
      isLastTurn: true,
      firstFinisher: updatedRider,
      phase: GamePhase.LAST_TURN,
      gameLog: [
        ...newState.gameLog,
        `🏁 ${rider.name} atteint l'arrivée → DERNIER TOUR!`
      ]
    };
  } else if (crossingFinish) {
    newState.gameLog = [...newState.gameLog, `🏁 ${rider.name} atteint l'arrivée`];
  }
  
  return moveToNextPlayer(newState);
}

/**
 * Move to next player or end turn (v4.0: supports N teams)
 */
export function moveToNextPlayer(state) {
  const currentTeam = state.currentTeam;
  const teamIds = state.teamIds || [TeamId.TEAM_A, TeamId.TEAM_B];
  const numTeams = teamIds.length;
  
  // Try to find the next team with available riders
  for (let i = 1; i <= numTeams; i++) {
    const nextTeam = getNextTeamInRotation(currentTeam, teamIds, i);
    
    if (teamHasAvailableRiders(state, nextTeam)) {
      return {
        ...state,
        currentTeam: nextTeam,
        selectedRiderId: null,
        selectedCardId: null,
        selectedSpecialtyId: null,
        turnPhase: TurnPhase.SELECT_RIDER,
        lastDiceRoll: null,
        lastMovement: null,
        gameLog: [
          ...state.gameLog,
          `🔄 Au tour de ${TeamConfigs[nextTeam]?.name || TeamConfig[nextTeam]?.playerName}`
        ]
      };
    }
  }
  
  // No team has available riders - apply end of turn effects
  return applyEndOfTurnEffects(state);
}

/**
 * Get team N steps ahead in rotation
 */
function getNextTeamInRotation(currentTeam, teamIds, steps = 1) {
  const currentIndex = teamIds.indexOf(currentTeam);
  const nextIndex = (currentIndex + steps) % teamIds.length;
  return teamIds[nextIndex];
}

/**
 * Apply end of turn effects (aspiration + wind cards)
 */
export function applyEndOfTurnEffects(state) {
  let updatedRiders = [...state.riders];
  let effects = [];
  let logMessages = [];
  let arrivalCounter = state.arrivalCounter;
  const weather = state.raceEventState?.weather || RaceWeather.CLEAR;
  
  // ===== PHASE 1: ASPIRATION (regroupement) =====
  // v3.3 FIX: Corrected aspiration rules
  // - Gap of 2 positions = 1 empty case between groups → aspiration applies
  // - Process from BACK to FRONT (ascending positions)
  // - Only blocked if benefiting group is in mountain
  // - Cascade effect: when a group moves forward, groups behind follow if they become adjacent
  
  let regroupingOccurred = true;
  let iterations = 0;
  
  while (regroupingOccurred && iterations < 50) {
    regroupingOccurred = false;
    iterations++;
    
    // Get all unique positions with riders (excluding finished), sorted ASCENDING (back to front)
    const positionsWithRiders = [...new Set(
      updatedRiders
        .filter(r => !r.hasFinished)
        .map(r => r.position)
    )].sort((a, b) => a - b); // ASCENDING = back to front
    
    // Check each position pair for aspiration (from BACK to FRONT)
    for (let i = 0; i < positionsWithRiders.length - 1; i++) {
      const backPos = positionsWithRiders[i];      // Smaller position (back)
      const frontPos = positionsWithRiders[i + 1]; // Larger position (front)
      const gap = frontPos - backPos;
      
      // Aspiration only happens with gap of 2 (1 empty case between groups)
      if (gap !== 2) continue;
      
      // Check terrain - no aspiration if BACK group is in mountain
      const terrainAtBack = getTerrainAt(state, backPos);
      if (!hasAspiration(terrainAtBack)) {
        continue;
      }
      
      // Target position is backPos + 1 (advance by 1 case to fill the gap)
      const targetPos = backPos + 1;
      const terrainAtTarget = getTerrainAt(state, targetPos);
      if (!hasAspiration(terrainAtTarget)) {
        continue;
      }
      
      // Get riders at back position
      const ridersAtBack = updatedRiders.filter(r => 
        r.position === backPos && !r.hasFinished
      );
      
      if (ridersAtBack.length === 0) continue;
      
      // Check if target position has room (max 4 riders per cell)
      const ridersAtTarget = updatedRiders.filter(r => 
        r.position === targetPos && !r.hasFinished
      );
      
      const availableSlots = MAX_RIDERS_PER_CELL - ridersAtTarget.length;
      
      if (availableSlots <= 0) continue;
      
      // Move riders from back to target (up to available slots)
      const ridersToMove = ridersAtBack.slice(0, availableSlots);
      
      ridersToMove.forEach(rider => {
        const riderIndex = updatedRiders.findIndex(r => r.id === rider.id);
        updatedRiders[riderIndex] = {
          ...updatedRiders[riderIndex],
          position: targetPos,
          arrivalOrder: arrivalCounter++
        };
        
        effects.push({
          type: 'aspiration',
          riderId: rider.id,
          riderName: rider.name,
          fromPosition: backPos,
          toPosition: targetPos
        });
      });
      
      regroupingOccurred = true;
    }
  }
  
  if (effects.filter(e => e.type === 'aspiration').length > 0) {
    const aspirationRiders = effects
      .filter(e => e.type === 'aspiration')
      .map(e => `${e.riderName} (${e.fromPosition}→${e.toPosition})`);
    logMessages.push(`🌀 Aspiration: ${aspirationRiders.join(', ')}`);
  }
  
  // ===== PHASE 2: WIND CARDS (prise de vent) =====
  // Calculated AFTER aspiration
  // Rules:
  // - No wind on mountain/descent (end-turn card is +2 there)
  // - Empty cell in front → leader takes wind, others sheltered (outside mountain/descent)
  
  // Get all unique positions with riders after regrouping
  const finalPositions = [...new Set(
    updatedRiders
      .filter(r => !r.hasFinished)
      .map(r => r.position)
  )].sort((a, b) => b - a); // Descending (front to back)
  
  // Identify who takes wind, who gets end-turn cards, and who is eligible for shelter recovery
  const windRiderIds = new Set();
  const shelteredRiderIds = new Set();
  const abriEligibleRiderIds = new Set();
  
  for (const pos of finalPositions) {
    // Get riders at this position sorted by arrival order
    const ridersAtPos = updatedRiders
      .filter(r => r.position === pos && !r.hasFinished)
      .sort((a, b) => a.arrivalOrder - b.arrivalOrder); // First arrived = rightmost
    
    if (ridersAtPos.length === 0) continue;
    
    const terrain = getTerrainAt(state, pos);
    const isMountain = terrain === TerrainType.MOUNTAIN;
    const isDescent = terrain === TerrainType.DESCENT;

    if (isMountain || isDescent) {
      ridersAtPos.forEach(rider => shelteredRiderIds.add(rider.id));
      if (isDescent) {
        ridersAtPos.forEach(rider => abriEligibleRiderIds.add(rider.id));
      }
      continue;
    }

    // Check if cell in front (pos + 1) is empty
    const cellInFrontEmpty = !updatedRiders.some(r => 
      r.position === pos + 1 && !r.hasFinished
    );
    
    if (cellInFrontEmpty) {
      // Leader (first arrived = rightmost) takes wind
      const leader = ridersAtPos[0];
      windRiderIds.add(leader.id);
      
      // Others at same position are sheltered
      ridersAtPos.slice(1).forEach(rider => {
        shelteredRiderIds.add(rider.id);
        abriEligibleRiderIds.add(rider.id);
      });
    } else {
      // Cell in front occupied - everyone here is sheltered
      ridersAtPos.forEach(rider => {
        shelteredRiderIds.add(rider.id);
        abriEligibleRiderIds.add(rider.id);
      });
    }
  }
    
    // Apply wind cards to leaders taking wind (penalty applies next move)
    Array.from(windRiderIds).forEach(riderId => {
      const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
      if (riderIndex !== -1) {
        const rider = updatedRiders[riderIndex];
        const windCardValue = rider.type === RiderType.ROULEUR ? 2 : 1;
        const eventCardPenalty = getRaceEventCardPenalty(rider);
        const adjustedWindCardValue = Math.max(1, windCardValue - eventCardPenalty);
        const baseWindPenalty = rider.type === RiderType.ROULEUR
          ? WIND_PENALTY_ROULEUR
          : WIND_PENALTY_DEFAULT;
        const windPenalty = applyWindPenaltyModifier(baseWindPenalty, weather);
        const windCard = createMovementCard(adjustedWindCardValue, 'Relais', '#94a3b8');
        
        updatedRiders[riderIndex] = {
          ...rider,
          hand: [...rider.hand, windCard],
          windPenaltyNextMove: Math.max(rider.windPenaltyNextMove || 0, windPenalty)
        };
        
        effects.push({
          type: 'wind',
          riderId: rider.id,
          riderName: rider.name,
          cardValue: adjustedWindCardValue,
          windPenalty
        });
      }
    });
    
    // Apply tempo cards (+2) to sheltered riders + v3.3: energy recovery
    Array.from(shelteredRiderIds).forEach(riderId => {
      const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
      if (riderIndex !== -1) {
        const rider = updatedRiders[riderIndex];
        const eventCardPenalty = getRaceEventCardPenalty(rider);
        const adjustedBonusValue = Math.max(1, 2 - eventCardPenalty);
        const bonusCard = createMovementCard(adjustedBonusValue, 'Tempo', '#86efac');
        const isAbriEligible = abriEligibleRiderIds.has(rider.id);
        
        // v3.3: Energy recovery for sheltered riders
        let energyRecovered = calculateRecovery({
          terrain: getTerrainAt(state, rider.position),
          distance: 0,
          isSheltered: isAbriEligible,
          inRefuelZone: false
        });
        energyRecovered = applyShelterRecoveryModifier(energyRecovered, weather, isAbriEligible);
        const newEnergy = applyEnergyChange(rider.energy, 0, energyRecovered);
        
        updatedRiders[riderIndex] = {
          ...rider,
          hand: [...rider.hand, bonusCard],
          energy: newEnergy
        };
        
        effects.push({
          type: 'shelter',
          riderId: rider.id,
          riderName: rider.name,
          cardValue: adjustedBonusValue,
          energyRecovered // v3.3
        });
      }
    });
    
    if (windRiderIds.size > 0) {
      const windRiders = effects
        .filter(e => e.type === 'wind')
        .map(e => `${e.riderName} (+${e.cardValue})`);
      logMessages.push(`💨 Relais: ${windRiders.join(', ')}`);
    }
    
  if (shelteredRiderIds.size > 0) {
    const shelterRiders = effects
      .filter(e => e.type === 'shelter')
      .map(e => e.riderName);
    logMessages.push(`🎵 Tempo: ${shelterRiders.join(', ')} (cartes fin de tour)`);
  }

  // Clear race events that were active during this turn
  updatedRiders = updatedRiders.map(rider => tickRaceEvent(rider));

  // Roll a new race event for next turn (one per global turn max)
  const raceEventState = state.raceEventState || { cooldownTurns: 0, weather: RaceWeather.CLEAR };
  const getRiderContext = rider => {
    const pos = rider.position;
    const courseIndex = pos - 1;
    const cell = state.course?.[courseIndex];
    const terrain = cell?.terrain || getTerrainAt(state, pos);
    const isCobbles = !!cell?.isCobbles;
    const groupSize = updatedRiders.filter(r => !r.hasFinished && r.position === pos).length;
    const isIsolated = groupSize <= 1;
    const isExposed = (rider.windPenaltyNextMove || 0) > 0;

    let weight = 1;
    if (isIsolated) weight += 0.4;
    if (isExposed) weight += 0.3;
    if (terrain === TerrainType.DESCENT) weight += 0.3;
    if (isCobbles) weight += 0.2;

    return { terrain, isCobbles, weight };
  };
  const raceEventRoll = rollRaceEvent({
    riders: updatedRiders,
    ridersPlayedThisTurn: state.ridersPlayedThisTurn,
    getTerrainForRider: rider => getTerrainAt(state, rider.position),
    getRiderContext,
    weather: raceEventState.weather,
    cooldownTurns: raceEventState.cooldownTurns,
    rng: raceEventState.rng
  });

  let updatedRaceEventState = {
    ...raceEventState,
    cooldownTurns: raceEventRoll.cooldownTurns
  };

  if (raceEventRoll.event && raceEventRoll.riderId) {
    const riderIndex = updatedRiders.findIndex(r => r.id === raceEventRoll.riderId);
    if (riderIndex !== -1) {
      updatedRiders[riderIndex] = attachRaceEvent(updatedRiders[riderIndex], raceEventRoll.event);
      const eventLog = formatRaceEventLog(raceEventRoll.event, updatedRiders[riderIndex].name);
      logMessages.push(eventLog);
      effects.push({
        type: 'race_event',
        riderId: updatedRiders[riderIndex].id,
        riderName: updatedRiders[riderIndex].name,
        eventId: raceEventRoll.event.id
      });
    }
  }
  
  // Return state with effects for animation
  return {
    ...state,
    riders: updatedRiders,
    arrivalCounter,
    endTurnEffects: effects,
    raceEventState: updatedRaceEventState,
    turnPhase: TurnPhase.END_TURN_EFFECTS,
    gameLog: [...state.gameLog, ...logMessages]
  };
}

/**
 * Acknowledge end of turn effects and proceed
 */
export function acknowledgeEndTurnEffects(state) {
  // Reset fallen flags
  const ridersReset = state.riders.map(r => ({
    ...r,
    hasFallenThisTurn: false
  }));
  
  // If last turn, game is over
  if (state.isLastTurn) {
    const stageRankings = [...ridersReset].sort((a, b) => {
      // First by position (higher is better)
      if (b.position !== a.position) return b.position - a.position;
      // Then by arrival order (lower is better - arrived first)
      return a.arrivalOrder - b.arrivalOrder;
    });
    
    stageRankings.forEach((rider, index) => {
      rider.finalRank = index + 1;
    });

    let updatedStageRace = null;
    let finalRankings = stageRankings;
    let stageRaceComplete = false;

    if (state.stageRace) {
      const completedStage = state.stageRace.stages[state.stageRace.currentStageIndex];
      updatedStageRace = advanceStage(applyStageResults(state.stageRace, stageRankings));

      if (!isStageRaceComplete(updatedStageRace)) {
        const recoveredRiders = resetRidersForStage(applyStageRecovery(ridersReset));
        const nextStage = updatedStageRace.stages[updatedStageRace.currentStageIndex];
        const stageWinner = stageRankings[0];
        const stageLogs = [
          `\n══════════ 🏁 ÉTAPE ${completedStage.number} ══════════`,
          stageWinner ? `🏆 ${stageWinner.name} remporte l'étape` : '🏆 Étape terminée',
          `➡️ Étape ${nextStage.number} : ${nextStage.name}`
        ];

        const stageState = {
          ...state,
          riders: recoveredRiders,
          arrivalCounter: recoveredRiders.length,
          stageRace: updatedStageRace,
          courseLength: updatedStageRace.stageLength,
          finishLine: updatedStageRace.stageLength,
          course: generateStageCourse(nextStage.type, updatedStageRace.stageLength),
          phase: GamePhase.PLAYING,
          currentTurn: 1,
          currentTeam: state.teamIds[Math.floor(Math.random() * state.teamIds.length)],
          ridersPlayedThisTurn: [],
          selectedRiderId: null,
          selectedCardId: null,
          selectedSpecialtyId: null,
          lastDiceRoll: null,
          lastMovement: null,
          isLastTurn: false,
          firstFinisher: null,
          rankings: [],
          winningTeam: null,
          endTurnEffects: [],
          gameLog: [...state.gameLog, ...stageLogs]
        };

        return startTurn(stageState);
      }

      stageRaceComplete = true;
      const gcRanking = getClassificationRanking(
        updatedStageRace.standings[StageClassification.GENERAL]
      );
      finalRankings = gcRanking.map((entry, index) => ({
        id: entry.riderId,
        name: entry.name,
        team: entry.team,
        gcSeconds: entry.totalSeconds,
        lastStageRank: entry.lastStageRank,
        position: entry.lastStagePosition,
        finalRank: index + 1
      }));
    }
    
    // Determine team winner
    const teamAPositions = finalRankings
      .filter(r => r.team === Teams.TEAM_A)
      .slice(0, 3)
      .map((r, i) => finalRankings.findIndex(x => x.id === r.id) + 1);
    const teamBPositions = finalRankings
      .filter(r => r.team === Teams.TEAM_B)
      .slice(0, 3)
      .map((r, i) => finalRankings.findIndex(x => x.id === r.id) + 1);
    
    const teamAScore = teamAPositions.reduce((a, b) => a + b, 0);
    const teamBScore = teamBPositions.reduce((a, b) => a + b, 0);
    
    const winningTeam = teamAScore < teamBScore ? Teams.TEAM_A : 
                        teamBScore < teamAScore ? Teams.TEAM_B : null;
    
    const resultsLog = [
      `\n══════════ 🏆 RÉSULTATS ══════════`,
      ...finalRankings.slice(0, 10).map((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const suffix = stageRaceComplete
          ? `+${r.gcSeconds ?? 0}s`
          : `Case: ${r.position}`;
        return `${medal} ${r.name} (${TeamConfig[r.team]?.shortName}) - ${suffix}`;
      }),
      ``,
      winningTeam 
        ? `🎉 ${TeamConfig[winningTeam].name} gagne!`
        : `🤝 Égalité!`
    ];
    
    return {
      ...state,
      riders: ridersReset,
      stageRace: updatedStageRace || state.stageRace,
      phase: GamePhase.FINISHED,
      rankings: finalRankings,
      winningTeam,
      endTurnEffects: [],
      gameLog: [...state.gameLog, ...resultsLog]
    };
  }
  
  // Start next turn
  return startTurn({
    ...state,
    riders: ridersReset,
    currentTurn: state.currentTurn + 1,
    endTurnEffects: []
  });
}

/**
 * Legacy function for compatibility
 */
export function endTurn(state) {
  return acknowledgeEndTurnEffects(state);
}

/**
 * Get game status for display
 */
export function getGameStatus(state) {
  const currentRider = getCurrentRider(state);
  const terrain = currentRider ? getTerrainAt(state, currentRider.position) : null;
  const availableCards = currentRider ? getAvailableCards(currentRider, terrain) : null;
  const availableRiders = getAvailableRiders(state, state.currentTeam);
  
  return {
    turn: state.currentTurn,
    phase: state.phase,
    turnPhase: state.turnPhase,
    isLastTurn: state.isLastTurn,
    currentTeam: state.currentTeam,
    currentTeamConfig: TeamConfig[state.currentTeam],
    selectedRiderId: state.selectedRiderId,
    selectedCardId: state.selectedCardId,
    selectedSpecialtyId: state.selectedSpecialtyId,
    availableRiders,
    currentRider: currentRider ? {
      ...currentRider,
      config: RiderConfig[currentRider.type],
      teamConfig: TeamConfig[currentRider.team],
      terrain,
      terrainConfig: TerrainConfig[terrain],
      terrainBonus: getTerrainBonus(terrain, currentRider.type),
      availableCards,
      handStats: getHandStats(currentRider)
    } : null,
    leader: state.riders.reduce((l, r) => r.position > l.position ? r : l, state.riders[0]),
    firstFinisher: state.firstFinisher,
    rankings: state.rankings,
    winningTeam: state.winningTeam,
    lastDiceRoll: state.lastDiceRoll,
    lastMovement: state.lastMovement,
    ridersPlayedThisTurn: state.ridersPlayedThisTurn,
    endTurnEffects: state.endTurnEffects || [],
    calculatedMovement: state.turnPhase === TurnPhase.RESOLVE || state.turnPhase === TurnPhase.SELECT_SPECIALTY 
      ? calculateMovement(state) 
      : null
  };
}

// Exports
export {
  roll1D6,
  rollFallTest,
  TerrainType,
  TerrainConfig,
  getTerrainBonus,
  generateCourse,
  RiderConfig,
  CardType,
  createRider,
  getHandStats,
  MAX_RIDERS_PER_CELL
};
