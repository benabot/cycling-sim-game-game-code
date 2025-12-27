/**
 * Main game engine - v4.0 Multi-teams + AI
 * @module core/game_engine
 */

import { roll1D6, rollFallTest } from './dice.js';
import { TerrainType, TerrainConfig, DescentRules, MountainRules, getTerrainBonus, generateCourse, hasAspiration, hasWindPenalty, findSummitPosition, isExemptFromSummitStop, isRefuelZone } from './terrain.js';
import { 
  createRider, createTeamRiders, RiderConfig, CardType, RiderType,
  playCard, playSpecialtyCard, addFatigueCard, recycleCards, needsRecycle,
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

/**
 * Constants
 */
const MAX_RIDERS_PER_CELL = 4;

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
 * @returns {Array} Array of riders
 */
export function createRidersForTeams(teamIds) {
  const riders = [];
  teamIds.forEach(teamId => {
    const config = getTeamConfig(teamId);
    riders.push(...createTeamRiders(teamId, config.prefix));
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
  const effectiveCourseLength = gameConfig?.courseLength || courseLength;
  const teamIds = gameConfig?.players?.map(p => p.teamId) || [TeamId.TEAM_A, TeamId.TEAM_B];
  const players = gameConfig?.players || [
    { teamId: TeamId.TEAM_A, playerType: PlayerType.HUMAN },
    { teamId: TeamId.TEAM_B, playerType: PlayerType.HUMAN }
  ];
  
  const course = generateCourse(effectiveCourseLength);
  let riders = createRidersForTeams(teamIds);
  
  // All riders start at position 0 with arrival order
  riders = riders.map((r, index) => ({ 
    ...r, 
    position: 0,
    arrivalOrder: index // First riders are "rightmost" (arrived first)
  }));
  
  // Random starting team from available teams
  const startingTeam = teamIds[Math.floor(Math.random() * teamIds.length)];
  
  return {
    // Game configuration
    courseLength: effectiveCourseLength,
    finishLine: effectiveCourseLength,
    course,
    
    // v4.0: Multi-team configuration
    gameConfig,
    teamIds,
    players,
    numTeams: teamIds.length,
    
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
 */
export function getTerrainAt(state, position) {
  if (position >= state.courseLength) {
    return TerrainType.SPRINT;
  }
  if (position <= 0) {
    return TerrainType.FLAT;
  }
  return state.course[position]?.terrain || TerrainType.FLAT;
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
  
  // Recycle cards for riders with empty hands
  // Also decrement turnsToSkip and reset hasFallenThisTurn
  let updatedRiders = state.riders.map(rider => {
    let updated = rider;
    
    // Recycle if needed
    if (needsRecycle(updated)) {
      updated = recycleCards(updated);
    }
    
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
  
  baseMovement = Math.max(1, baseMovement);
  
  // Calculate position without specialty
  let targetWithoutSpecialty = rider.position + baseMovement;
  
  // Check summit stop for non-climbers (without specialty)
  let summitStopWithout = null;
  if (!isExemptFromSummitStop(rider.type)) {
    summitStopWithout = findSummitPosition(state.course, rider.position, targetWithoutSpecialty);
    if (summitStopWithout !== null) {
      targetWithoutSpecialty = summitStopWithout;
    }
  }
  
  // Find available position (cell capacity)
  const finalWithoutSpecialty = findAvailablePosition(state, targetWithoutSpecialty);
  
  // Calculate position with specialty (+2)
  let targetWithSpecialty = rider.position + baseMovement + 2;
  
  // Check summit stop for non-climbers (with specialty)
  let summitStopWith = null;
  if (!isExemptFromSummitStop(rider.type)) {
    summitStopWith = findSummitPosition(state.course, rider.position, targetWithSpecialty);
    if (summitStopWith !== null) {
      targetWithSpecialty = summitStopWith;
    }
  }
  
  const finalWithSpecialty = findAvailablePosition(state, targetWithSpecialty);
  
  // Check if crossing finish
  const crossingFinishWithout = finalWithoutSpecialty >= state.finishLine;
  const crossingFinishWith = finalWithSpecialty >= state.finishLine;
  
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
    movementWithout: baseMovement,
    movementWith: baseMovement + 2,
    positionWithout: finalWithoutSpecialty,
    positionWith: finalWithSpecialty,
    summitStopWithout: summitStopWithout !== null,
    summitStopWith: summitStopWith !== null,
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
  
  const movement = calculateMovement(state);
  let targetPosition = rider.position + movement;
  const terrain = getTerrainAt(state, rider.position);
  
  // Check if crossing finish
  const crossingFinish = targetPosition >= state.finishLine && !rider.hasFinished;
  
  // v3.2: Check for summit stop (non-climbers must stop at mountain summit)
  let stoppedAtSummit = false;
  let summitPosition = null;
  if (!crossingFinish && !isExemptFromSummitStop(rider.type)) {
    summitPosition = findSummitPosition(state.course, rider.position, targetPosition);
    if (summitPosition !== null) {
      // Non-climber must stop at summit
      stoppedAtSummit = true;
      targetPosition = summitPosition;
    }
  }
  
  // If not crossing finish, check for cell capacity
  let newPosition = targetPosition;
  if (!crossingFinish) {
    newPosition = findAvailablePosition(state, targetPosition);
  }
  
  // Calculate actual distance moved
  const actualDistance = newPosition - rider.position;
  
  // Play the selected card
  let updatedRider = rider;
  const { rider: riderAfterCard, card: playedCard } = playCard(rider, state.selectedCardId);
  updatedRider = riderAfterCard;
  
  // Check if attack card was used
  const usedAttack = rider.attackCards.some(c => c.id === state.selectedCardId);
  
  // Play specialty card if selected
  const usedSpecialty = !!state.selectedSpecialtyId;
  if (usedSpecialty) {
    const { rider: riderAfterSpecialty } = playSpecialtyCard(updatedRider, state.selectedSpecialtyId);
    updatedRider = riderAfterSpecialty;
  }
  
  // v3.3: Calculate energy consumption
  const energyConsumed = calculateMovementConsumption({
    distance: actualDistance,
    terrain,
    riderType: rider.type,
    usedAttack,
    usedSpecialty,
    isLeading: false // Will be determined at end of turn
  });
  
  // v3.3: Calculate energy recovery (descent)
  const energyRecovered = calculateRecovery({
    terrain,
    distance: terrain === 'descent' ? actualDistance : 0,
    isSheltered: false, // Determined at end of turn
    inRefuelZone: isRefuelZone(state.course, newPosition)
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
    finishPosition: crossingFinish ? state.rankings.length + 1 : null,
    energy: newEnergy // v3.3
  };
  
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
  
  if (stoppedAtSummit) {
    logMessage += ` (⛰️ arrêt au sommet, case ${newPosition})`;
  } else if (!crossingFinish && newPosition !== targetPosition) {
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
    gameLog: [...state.gameLog, logMessage]
  };
  
  // Update rankings if finished
  if (crossingFinish) {
    newState.rankings = [...newState.rankings, updatedRider];
  }
  
  // Check if first finisher
  if (crossingFinish && !state.isLastTurn && !state.firstFinisher) {
    newState = {
      ...newState,
      isLastTurn: true,
      firstFinisher: updatedRider,
      phase: GamePhase.LAST_TURN,
      gameLog: [
        ...newState.gameLog,
        `🏁 ${rider.name} franchit la ligne en premier! DERNIER TOUR!`
      ]
    };
  } else if (crossingFinish) {
    newState.gameLog = [...newState.gameLog, `🏁 ${rider.name} franchit la ligne!`];
  }
  
  return moveToNextPlayer(newState);
}

/**
 * Move to next player or end turn
 */
export function moveToNextPlayer(state) {
  const currentTeam = state.currentTeam;
  const otherTeam = getOtherTeam(currentTeam);
  
  // Check if other team has available riders
  if (teamHasAvailableRiders(state, otherTeam)) {
    return {
      ...state,
      currentTeam: otherTeam,
      selectedRiderId: null,
      selectedCardId: null,
      selectedSpecialtyId: null,
      turnPhase: TurnPhase.SELECT_RIDER,
      lastDiceRoll: null,
      lastMovement: null,
      gameLog: [
        ...state.gameLog,
        `🔄 Au tour de ${TeamConfig[otherTeam].playerName}`
      ]
    };
  }
  
  // Check if current team still has riders
  if (teamHasAvailableRiders(state, currentTeam)) {
    return {
      ...state,
      selectedRiderId: null,
      selectedCardId: null,
      selectedSpecialtyId: null,
      turnPhase: TurnPhase.SELECT_RIDER,
      lastDiceRoll: null,
      lastMovement: null
    };
  }
  
  // Both teams have played all riders - apply end of turn effects
  return applyEndOfTurnEffects(state);
}

/**
 * Apply end of turn effects (aspiration + wind cards)
 */
export function applyEndOfTurnEffects(state) {
  let updatedRiders = [...state.riders];
  let effects = [];
  let logMessages = [];
  let arrivalCounter = state.arrivalCounter;
  
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
  // - In MOUNTAIN: everyone gets +2 (no wind penalty)
  // - Other terrains: empty cell in front → leader gets +1 (wind), others +2 (shelter)
  
  // Get all unique positions with riders after regrouping
  const finalPositions = [...new Set(
    updatedRiders
      .filter(r => !r.hasFinished)
      .map(r => r.position)
  )].sort((a, b) => b - a); // Descending (front to back)
  
  // Identify who takes wind and who is sheltered
  const windRiderIds = [];
  const shelteredRiderIds = [];
  
  for (const pos of finalPositions) {
    const terrain = getTerrainAt(state, pos);
    
    // Get riders at this position sorted by arrival order
    const ridersAtPos = updatedRiders
      .filter(r => r.position === pos && !r.hasFinished)
      .sort((a, b) => a.arrivalOrder - b.arrivalOrder); // First arrived = rightmost
    
    if (ridersAtPos.length === 0) continue;
    
    // In mountain: everyone is sheltered (no wind)
    if (terrain === TerrainType.MOUNTAIN) {
      ridersAtPos.forEach(r => shelteredRiderIds.push(r.id));
      continue;
    }
    
    // Other terrains: check if cell in front (pos + 1) is empty
    const cellInFrontEmpty = !updatedRiders.some(r => 
      r.position === pos + 1 && !r.hasFinished
    );
    
    if (cellInFrontEmpty) {
      // Leader (first arrived = rightmost) takes wind
      // v3.2: Rouleurs are immune to wind (always get shelter bonus)
      const leader = ridersAtPos[0];
      
      if (leader.type === RiderType.ROULEUR) {
        // Rouleur gets shelter instead of wind (immune to wind)
        shelteredRiderIds.push(leader.id);
      } else {
        windRiderIds.push(leader.id);
      }
      
      // Others at same position are sheltered
      ridersAtPos.slice(1).forEach(r => shelteredRiderIds.push(r.id));
    } else {
      // Cell in front occupied - everyone here is sheltered
      ridersAtPos.forEach(r => shelteredRiderIds.push(r.id));
    }
  }
    
    // Apply wind cards (+1) to leaders taking wind + v3.3: energy penalty
    windRiderIds.forEach(riderId => {
      const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
      if (riderIndex !== -1) {
        const rider = updatedRiders[riderIndex];
        const windCard = createMovementCard(1, 'Relais', '#94a3b8');
        
        // v3.3: Wind penalty consumes energy
        const energyConsumed = EnergyConfig.consumption.windPenalty;
        const newEnergy = applyEnergyChange(rider.energy, energyConsumed, 0);
        
        updatedRiders[riderIndex] = {
          ...rider,
          hand: [...rider.hand, windCard],
          energy: newEnergy
        };
        
        effects.push({
          type: 'wind',
          riderId: rider.id,
          riderName: rider.name,
          cardValue: 1,
          energyConsumed // v3.3
        });
      }
    });
    
    // Apply tempo cards (+2) to sheltered riders + v3.3: energy recovery
    shelteredRiderIds.forEach(riderId => {
      const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
      if (riderIndex !== -1) {
        const rider = updatedRiders[riderIndex];
        const bonusCard = createMovementCard(2, 'Tempo', '#86efac');
        
        // v3.3: Energy recovery for sheltered riders
        const energyRecovered = calculateRecovery({
          terrain: getTerrainAt(state, rider.position),
          distance: 0,
          isSheltered: true,
          inRefuelZone: false
        });
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
          cardValue: 2,
          energyRecovered // v3.3
        });
      }
    });
    
    if (windRiderIds.length > 0) {
      const windRiders = effects
        .filter(e => e.type === 'wind')
        .map(e => e.riderName);
      logMessages.push(`💨 Relais: ${windRiders.join(', ')} (carte +1)`);
    }
    
    if (shelteredRiderIds.length > 0) {
      const shelterRiders = effects
        .filter(e => e.type === 'shelter')
        .map(e => e.riderName);
      logMessages.push(`🎵 Tempo: ${shelterRiders.join(', ')} (carte +2)`);
    }
  
  // Return state with effects for animation
  return {
    ...state,
    riders: updatedRiders,
    arrivalCounter,
    endTurnEffects: effects,
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
    const rankings = [...ridersReset].sort((a, b) => {
      // First by position (higher is better)
      if (b.position !== a.position) return b.position - a.position;
      // Then by arrival order (lower is better - arrived first)
      return a.arrivalOrder - b.arrivalOrder;
    });
    
    rankings.forEach((rider, index) => {
      rider.finalRank = index + 1;
    });
    
    // Determine team winner
    const teamAPositions = rankings
      .filter(r => r.team === Teams.TEAM_A)
      .slice(0, 3)
      .map((r, i) => rankings.findIndex(x => x.id === r.id) + 1);
    const teamBPositions = rankings
      .filter(r => r.team === Teams.TEAM_B)
      .slice(0, 3)
      .map((r, i) => rankings.findIndex(x => x.id === r.id) + 1);
    
    const teamAScore = teamAPositions.reduce((a, b) => a + b, 0);
    const teamBScore = teamBPositions.reduce((a, b) => a + b, 0);
    
    const winningTeam = teamAScore < teamBScore ? Teams.TEAM_A : 
                        teamBScore < teamAScore ? Teams.TEAM_B : null;
    
    const resultsLog = [
      `\n══════════ 🏆 RÉSULTATS ══════════`,
      ...rankings.slice(0, 10).map((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} ${r.name} (${TeamConfig[r.team]?.shortName}) - Case: ${r.position}`;
      }),
      ``,
      winningTeam 
        ? `🎉 ${TeamConfig[winningTeam].name} gagne!`
        : `🤝 Égalité!`
    ];
    
    return {
      ...state,
      riders: ridersReset,
      phase: GamePhase.FINISHED,
      rankings,
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
