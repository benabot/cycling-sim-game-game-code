/**
 * Main game engine - orchestrates all game mechanics
 * @module core/game_engine
 */

import { roll2D6, rollFallTest } from './dice.js';
import { TerrainType, TerrainConfig, DescentRules, getTerrainBonus, generateCourse } from './terrain.js';
import { createRider, createTestRiders, getFatiguePenalty, addFatigue, removeFatigue, useAttackCard, moveRider, RiderConfig } from './rider.js';
import { createGameDecks, drawCard, applyCardEffect, getCardDescription } from './cards.js';
import { isTakingWind, isInPeloton, applyAspiration, getRiderGroups, getGapToLeader } from './aspiration.js';

/**
 * Game phases
 */
export const GamePhase = {
  SETUP: 'setup',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

/**
 * Turn phases
 */
export const TurnPhase = {
  SELECT_RIDER: 'select_rider',
  PRE_ROLL: 'pre_roll',       // Can use attack card
  ROLL_DICE: 'roll_dice',
  RESOLVE: 'resolve',
  NEXT_RIDER: 'next_rider'
};

/**
 * Create initial game state
 * @param {Object} options - Game options
 * @returns {Object} Initial game state
 */
export function createGameState(options = {}) {
  const {
    courseLength = 50,
    riderCount = 5,
    courseDistribution = null
  } = options;
  
  const course = generateCourse(courseLength, courseDistribution);
  const riders = createTestRiders().slice(0, riderCount);
  const { penaltyDeck, bonusDeck } = createGameDecks();
  
  return {
    // Game configuration
    courseLength,
    finishLine: courseLength,
    course,
    
    // Riders
    riders,
    
    // Decks
    penaltyDeck,
    bonusDeck,
    
    // Game state
    phase: GamePhase.PLAYING,
    turnPhase: TurnPhase.SELECT_RIDER,
    currentTurn: 1,
    
    // Current turn state
    currentRiderIndex: null,
    turnOrder: [],
    
    // Action state
    lastDiceRoll: null,
    lastCard: null,
    lastMovement: null,
    
    // Flags
    attackUsedThisTurn: false,
    canReroll: false,
    
    // Log
    turnLog: [],
    
    // Winner
    winner: null,
    rankings: []
  };
}

/**
 * Get terrain at a specific position
 * @param {Object} state - Game state
 * @param {number} position - Position on course
 * @returns {string} Terrain type
 */
export function getTerrainAt(state, position) {
  if (position >= state.courseLength) {
    return TerrainType.SPRINT; // After finish line
  }
  if (position < 0) {
    return TerrainType.FLAT;
  }
  return state.course[position]?.terrain || TerrainType.FLAT;
}

/**
 * Determine turn order based on position (leader first)
 * @param {Array} riders - All riders
 * @returns {Array} Ordered rider IDs
 */
export function determineTurnOrder(riders) {
  const activeRiders = riders.filter(r => !r.hasFinished);
  
  // Sort by position descending (leader first)
  const sorted = [...activeRiders].sort((a, b) => b.position - a.position);
  
  return sorted.map(r => r.id);
}

/**
 * Start a new turn
 * @param {Object} state - Current game state
 * @returns {Object} Updated game state
 */
export function startTurn(state) {
  const turnOrder = determineTurnOrder(state.riders);
  
  if (turnOrder.length === 0) {
    return {
      ...state,
      phase: GamePhase.FINISHED
    };
  }
  
  return {
    ...state,
    turnOrder,
    currentRiderIndex: 0,
    turnPhase: TurnPhase.SELECT_RIDER,
    turnLog: [`--- Tour ${state.currentTurn} ---`]
  };
}

/**
 * Get current rider
 * @param {Object} state - Game state
 * @returns {Object|null} Current rider or null
 */
export function getCurrentRider(state) {
  if (state.currentRiderIndex === null || state.turnOrder.length === 0) {
    return null;
  }
  
  const riderId = state.turnOrder[state.currentRiderIndex];
  return state.riders.find(r => r.id === riderId);
}

/**
 * Select rider for action (move to pre-roll phase)
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function selectRider(state) {
  const rider = getCurrentRider(state);
  if (!rider) return state;
  
  const terrain = getTerrainAt(state, rider.position);
  const takingWind = isTakingWind(rider, state.riders, terrain);
  
  let newState = {
    ...state,
    turnPhase: TurnPhase.PRE_ROLL,
    attackUsedThisTurn: false,
    canReroll: false,
    lastCard: null,
    lastDiceRoll: null,
    lastMovement: null
  };
  
  // Draw penalty card if taking wind
  if (takingWind) {
    const { card, deck } = drawCard(state.penaltyDeck);
    if (card) {
      newState.penaltyDeck = deck;
      newState.lastCard = { type: 'penalty', card };
      newState.turnLog = [
        ...newState.turnLog,
        `${rider.name} prend le vent → ${card.name}: ${getCardDescription(card)}`
      ];
    }
  }
  
  return newState;
}

/**
 * Use attack card for current rider
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function playAttackCard(state) {
  const rider = getCurrentRider(state);
  if (!rider || state.attackUsedThisTurn) return state;
  
  const { rider: updatedRider, success } = useAttackCard(rider);
  
  if (!success) {
    return {
      ...state,
      turnLog: [...state.turnLog, `${rider.name} ne peut pas utiliser de carte Attaque`]
    };
  }
  
  const updatedRiders = state.riders.map(r => 
    r.id === rider.id ? updatedRider : r
  );
  
  return {
    ...state,
    riders: updatedRiders,
    attackUsedThisTurn: true,
    turnLog: [...state.turnLog, `${rider.name} joue Attaque (+3, +1 fatigue)`]
  };
}

/**
 * Roll dice and calculate movement
 * @param {Object} state - Game state
 * @returns {Object} Updated state with dice roll and movement calculation
 */
export function rollDice(state) {
  const rider = getCurrentRider(state);
  if (!rider) return state;
  
  const terrain = getTerrainAt(state, rider.position);
  const diceRoll = roll2D6();
  
  let newState = {
    ...state,
    lastDiceRoll: diceRoll,
    turnPhase: TurnPhase.RESOLVE
  };
  
  // Check for bonus card on 7
  if (diceRoll.isSeven) {
    const { card, deck } = drawCard(state.bonusDeck);
    if (card) {
      newState.bonusDeck = deck;
      newState.lastCard = { type: 'bonus', card };
      newState.turnLog = [
        ...newState.turnLog,
        `${rider.name} fait 7 → ${card.name}: ${getCardDescription(card)}`
      ];
      
      // Check if can reroll
      if (card.effect.reroll) {
        newState.canReroll = true;
      }
    }
  }
  
  // Check for fall in descent on snake eyes
  if (terrain === TerrainType.DESCENT && diceRoll.isSnakeEyes) {
    const fallTest = rollFallTest();
    newState.turnLog = [
      ...newState.turnLog,
      `${rider.name} fait double 1 en descente → Test de chute: ${fallTest.roll}`
    ];
    
    if (fallTest.hasFallen) {
      // Apply fall: move back 3, +2 fatigue
      const updatedRider = addFatigue({
        ...rider,
        position: Math.max(0, rider.position - 3),
        hasFallenThisTurn: true
      }, 2);
      
      newState.riders = state.riders.map(r => 
        r.id === rider.id ? updatedRider : r
      );
      newState.turnLog = [
        ...newState.turnLog,
        `${rider.name} CHUTE! Recule de 3 cases, +2 fatigue`
      ];
      newState.lastMovement = { type: 'fall', distance: -3 };
      
      return newState;
    } else {
      newState.turnLog = [
        ...newState.turnLog,
        `${rider.name} évite la chute!`
      ];
    }
  }
  
  return newState;
}

/**
 * Calculate final movement for current rider
 * @param {Object} state - Game state
 * @returns {number} Final movement value
 */
export function calculateMovement(state) {
  const rider = getCurrentRider(state);
  if (!rider || !state.lastDiceRoll) return 0;
  
  const terrain = getTerrainAt(state, rider.position);
  let movement = state.lastDiceRoll.total;
  
  // Apply terrain bonus
  movement += getTerrainBonus(terrain, rider.type);
  
  // Apply attack card bonus
  if (state.attackUsedThisTurn) {
    movement += 3;
  }
  
  // Apply penalty card effects
  if (state.lastCard?.type === 'penalty') {
    const effect = state.lastCard.card.effect;
    if (effect.movement) movement += effect.movement;
    if (effect.noMove) return 0;
    if (effect.maxMove && movement > effect.maxMove) movement = effect.maxMove;
    if (effect.minMove && movement < effect.minMove) movement = effect.minMove;
  }
  
  // Apply bonus card effects
  if (state.lastCard?.type === 'bonus') {
    const effect = state.lastCard.card.effect;
    if (effect.movement) movement += effect.movement;
  }
  
  // Apply fatigue penalty
  const fatiguePenalty = getFatiguePenalty(rider.fatigue);
  movement += fatiguePenalty.penalty;
  if (fatiguePenalty.maxMove && movement > fatiguePenalty.maxMove) {
    movement = fatiguePenalty.maxMove;
  }
  
  // Apply descent minimum speed
  if (terrain === TerrainType.DESCENT) {
    movement = Math.max(movement, DescentRules.minSpeed);
  }
  
  // Minimum 1 (unless special conditions)
  return Math.max(1, movement);
}

/**
 * Resolve movement and apply effects
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function resolveMovement(state) {
  const rider = getCurrentRider(state);
  if (!rider) return state;
  
  // Skip if fallen this turn
  if (rider.hasFallenThisTurn) {
    return moveToNextRider(state);
  }
  
  const terrain = getTerrainAt(state, rider.position);
  const movement = calculateMovement(state);
  const newPosition = rider.position + movement;
  
  // Apply card fatigue effects
  let fatigueChange = 0;
  if (state.lastCard?.type === 'penalty' && state.lastCard.card.effect.fatigue) {
    fatigueChange += state.lastCard.card.effect.fatigue;
  }
  if (state.lastCard?.type === 'bonus' && state.lastCard.card.effect.fatigue) {
    fatigueChange += state.lastCard.card.effect.fatigue;
  }
  
  // Update rider
  let updatedRider = moveRider(rider, newPosition, state.finishLine);
  if (fatigueChange !== 0) {
    updatedRider = addFatigue(updatedRider, fatigueChange);
  }
  
  // Check for descent recovery
  if (terrain === TerrainType.DESCENT && isInPeloton(rider, state.riders)) {
    updatedRider = removeFatigue(updatedRider, DescentRules.recoveryInPeloton);
  }
  
  const updatedRiders = state.riders.map(r => 
    r.id === rider.id ? updatedRider : r
  );
  
  // Apply aspiration
  const ridersAfterAspiration = applyAspiration(updatedRiders, terrain);
  
  const newState = {
    ...state,
    riders: ridersAfterAspiration,
    lastMovement: { type: 'move', distance: movement },
    turnLog: [
      ...state.turnLog,
      `${rider.name} avance de ${movement} cases (position: ${newPosition})`
    ]
  };
  
  // Check for winner
  if (updatedRider.hasFinished && !state.winner) {
    return {
      ...newState,
      winner: updatedRider,
      turnLog: [
        ...newState.turnLog,
        `🏆 ${rider.name} franchit la ligne d'arrivée!`
      ]
    };
  }
  
  return moveToNextRider(newState);
}

/**
 * Move to next rider or end turn
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function moveToNextRider(state) {
  const nextIndex = state.currentRiderIndex + 1;
  
  // Check if turn is complete
  if (nextIndex >= state.turnOrder.length) {
    return endTurn(state);
  }
  
  return {
    ...state,
    currentRiderIndex: nextIndex,
    turnPhase: TurnPhase.SELECT_RIDER,
    attackUsedThisTurn: false,
    canReroll: false,
    lastCard: null,
    lastDiceRoll: null,
    lastMovement: null
  };
}

/**
 * End current turn and check for game end
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function endTurn(state) {
  // Reset fallen flags
  const ridersReset = state.riders.map(r => ({
    ...r,
    hasFallenThisTurn: false,
    isInPeloton: isInPeloton(r, state.riders)
  }));
  
  // Check if game should end (someone finished)
  const finishedRiders = ridersReset.filter(r => r.hasFinished);
  
  if (finishedRiders.length > 0) {
    // Determine final rankings
    const rankings = [...finishedRiders].sort((a, b) => b.finishPosition - a.finishPosition);
    
    return {
      ...state,
      riders: ridersReset,
      phase: GamePhase.FINISHED,
      rankings,
      currentTurn: state.currentTurn + 1,
      turnLog: [
        ...state.turnLog,
        `=== Fin de la course! ===`,
        `🥇 Vainqueur: ${rankings[0].name}`
      ]
    };
  }
  
  // Start next turn
  return startTurn({
    ...state,
    riders: ridersReset,
    currentTurn: state.currentTurn + 1
  });
}

/**
 * Get game status for display
 * @param {Object} state - Game state
 * @returns {Object} Status info
 */
export function getGameStatus(state) {
  const currentRider = getCurrentRider(state);
  const groups = getRiderGroups(state.riders);
  
  return {
    turn: state.currentTurn,
    phase: state.phase,
    turnPhase: state.turnPhase,
    currentRider: currentRider ? {
      ...currentRider,
      config: RiderConfig[currentRider.type],
      terrain: getTerrainAt(state, currentRider.position),
      terrainConfig: TerrainConfig[getTerrainAt(state, currentRider.position)],
      fatigueStatus: getFatiguePenalty(currentRider.fatigue),
      gapToLeader: getGapToLeader(currentRider, state.riders)
    } : null,
    groups,
    leader: state.riders.reduce((l, r) => r.position > l.position ? r : l, state.riders[0]),
    winner: state.winner,
    lastDiceRoll: state.lastDiceRoll,
    lastCard: state.lastCard,
    lastMovement: state.lastMovement,
    canAttack: currentRider && !state.attackUsedThisTurn && currentRider.attackCardsRemaining > 0,
    canReroll: state.canReroll
  };
}

// Export all modules for convenience
export {
  roll2D6,
  rollFallTest,
  TerrainType,
  TerrainConfig,
  getTerrainBonus,
  generateCourse,
  RiderConfig,
  createRider,
  getFatiguePenalty,
  createGameDecks,
  getCardDescription,
  getRiderGroups
};
