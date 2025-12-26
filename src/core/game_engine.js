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
  LAST_TURN: 'last_turn',
  FINISHED: 'finished'
};

/**
 * Turn phases
 */
export const TurnPhase = {
  SELECT_RIDER: 'select_rider',
  PRE_ROLL: 'pre_roll',
  ROLL_DICE: 'roll_dice',
  RESOLVE: 'resolve',
  NEXT_PLAYER: 'next_player'
};

/**
 * Team configuration
 */
export const Teams = {
  TEAM_A: 'team_a',
  TEAM_B: 'team_b'
};

export const TeamConfig = {
  [Teams.TEAM_A]: {
    name: 'Équipe Rouge',
    shortName: 'Rouge',
    color: '#dc2626',
    bgColor: '#fecaca',
    borderColor: '#b91c1c',
    playerName: 'Joueur 1'
  },
  [Teams.TEAM_B]: {
    name: 'Équipe Bleue',
    shortName: 'Bleue',
    color: '#2563eb',
    bgColor: '#bfdbfe',
    borderColor: '#1d4ed8',
    playerName: 'Joueur 2'
  }
};

/**
 * Create riders for two teams
 * @returns {Array} Array of 10 riders (5 per team)
 */
export function createTwoTeamsRiders() {
  const riderTypes = ['climber', 'puncher', 'rouleur', 'sprinter', 'versatile'];
  const riders = [];
  
  // Team A (Red)
  riderTypes.forEach((type, index) => {
    riders.push(createRider(
      `a${index + 1}`,
      type,
      `${RiderConfig[type].name} A`,
      Teams.TEAM_A
    ));
  });
  
  // Team B (Blue)
  riderTypes.forEach((type, index) => {
    riders.push(createRider(
      `b${index + 1}`,
      type,
      `${RiderConfig[type].name} B`,
      Teams.TEAM_B
    ));
  });
  
  return riders;
}

/**
 * Create initial game state
 * @param {Object} options - Game options
 * @returns {Object} Initial game state
 */
export function createGameState(options = {}) {
  const {
    courseLength = 50,
    twoTeams = true,
    courseDistribution = null
  } = options;
  
  const course = generateCourse(courseLength, courseDistribution);
  const riders = twoTeams ? createTwoTeamsRiders() : createTestRiders();
  const { penaltyDeck, bonusDeck } = createGameDecks();
  
  // Random starting player
  const startingTeam = Math.random() < 0.5 ? Teams.TEAM_A : Teams.TEAM_B;
  
  return {
    // Game configuration
    courseLength,
    finishLine: courseLength,
    course,
    twoTeams,
    
    // Riders
    riders,
    
    // Decks
    penaltyDeck,
    bonusDeck,
    
    // Game state
    phase: GamePhase.PLAYING,
    turnPhase: TurnPhase.SELECT_RIDER,
    currentTurn: 1,
    
    // Player turn management
    currentTeam: startingTeam,
    ridersPlayedThisTurn: [],  // IDs of riders who have played this turn
    
    // Selected rider for current action
    selectedRiderId: null,
    
    // Last turn tracking
    isLastTurn: false,
    firstFinisher: null,
    
    // Action state
    lastDiceRoll: null,
    lastCard: null,
    lastMovement: null,
    
    // Flags
    attackUsedThisTurn: false,
    canReroll: false,
    
    // Log - persistent across turns
    gameLog: [],
    
    // Final rankings
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
    return TerrainType.SPRINT;
  }
  if (position < 0) {
    return TerrainType.FLAT;
  }
  return state.course[position]?.terrain || TerrainType.FLAT;
}

/**
 * Get the other team
 * @param {string} team - Current team
 * @returns {string} Other team
 */
export function getOtherTeam(team) {
  return team === Teams.TEAM_A ? Teams.TEAM_B : Teams.TEAM_A;
}

/**
 * Get available riders for a team (not yet played this turn, not finished)
 * @param {Object} state - Game state
 * @param {string} team - Team to check
 * @returns {Array} Available riders
 */
export function getAvailableRiders(state, team) {
  return state.riders.filter(r => 
    r.team === team && 
    !state.ridersPlayedThisTurn.includes(r.id) &&
    !r.hasFinished
  );
}

/**
 * Check if a team has available riders
 * @param {Object} state - Game state
 * @param {string} team - Team to check
 * @returns {boolean}
 */
export function teamHasAvailableRiders(state, team) {
  return getAvailableRiders(state, team).length > 0;
}

/**
 * Start a new turn
 * @param {Object} state - Current game state
 * @returns {Object} Updated game state
 */
export function startTurn(state) {
  // Determine starting team for this turn (alternate from last turn's starter)
  const startingTeam = state.currentTurn === 1 
    ? state.currentTeam 
    : getOtherTeam(state.lastTurnStarter || Teams.TEAM_A);
  
  // Add turn separator to log
  const turnHeader = state.isLastTurn 
    ? `\n══════════ 🏁 DERNIER TOUR (Tour ${state.currentTurn}) ══════════`
    : `\n────────── Tour ${state.currentTurn} ──────────`;
  
  const teamName = TeamConfig[startingTeam].shortName;
  
  return {
    ...state,
    currentTeam: startingTeam,
    lastTurnStarter: startingTeam,
    ridersPlayedThisTurn: [],
    selectedRiderId: null,
    turnPhase: TurnPhase.SELECT_RIDER,
    gameLog: [
      ...state.gameLog, 
      turnHeader,
      `🎮 ${TeamConfig[startingTeam].playerName} (${teamName}) commence`
    ]
  };
}

/**
 * Get current rider (selected)
 * @param {Object} state - Game state
 * @returns {Object|null} Current rider or null
 */
export function getCurrentRider(state) {
  if (!state.selectedRiderId) return null;
  return state.riders.find(r => r.id === state.selectedRiderId);
}

/**
 * Select a rider to play
 * @param {Object} state - Game state
 * @param {string} riderId - ID of rider to select
 * @returns {Object} Updated state
 */
export function selectRider(state, riderId) {
  const rider = state.riders.find(r => r.id === riderId);
  
  // Validation
  if (!rider) return state;
  if (rider.team !== state.currentTeam) return state;
  if (state.ridersPlayedThisTurn.includes(riderId)) return state;
  if (rider.hasFinished) return state;
  
  const terrain = getTerrainAt(state, rider.position);
  const takingWind = isTakingWind(rider, state.riders, terrain);
  
  let newState = {
    ...state,
    selectedRiderId: riderId,
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
      newState.gameLog = [
        ...newState.gameLog,
        `⚠️ ${rider.name} prend le vent → ${card.name}: ${getCardDescription(card)}`
      ];
    }
  }
  
  return newState;
}

/**
 * Deselect current rider (cancel selection)
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function deselectRider(state) {
  if (state.turnPhase !== TurnPhase.PRE_ROLL) return state;
  
  return {
    ...state,
    selectedRiderId: null,
    turnPhase: TurnPhase.SELECT_RIDER,
    lastCard: null
  };
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
      gameLog: [...state.gameLog, `❌ ${rider.name} ne peut pas utiliser de carte Attaque`]
    };
  }
  
  const updatedRiders = state.riders.map(r => 
    r.id === rider.id ? updatedRider : r
  );
  
  return {
    ...state,
    riders: updatedRiders,
    attackUsedThisTurn: true,
    gameLog: [...state.gameLog, `⚔️ ${rider.name} joue Attaque (+3, +1 fatigue)`]
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
      newState.gameLog = [
        ...newState.gameLog,
        `✨ ${rider.name} fait 7 → ${card.name}: ${getCardDescription(card)}`
      ];
      
      if (card.effect.reroll) {
        newState.canReroll = true;
      }
    }
  }
  
  // Check for fall in descent on snake eyes
  if (terrain === TerrainType.DESCENT && diceRoll.isSnakeEyes) {
    const fallTest = rollFallTest();
    newState.gameLog = [
      ...newState.gameLog,
      `🎲 ${rider.name} fait double 1 en descente → Test de chute: ${fallTest.roll}`
    ];
    
    if (fallTest.hasFallen) {
      const updatedRider = addFatigue({
        ...rider,
        position: Math.max(0, rider.position - 3),
        hasFallenThisTurn: true
      }, 2);
      
      newState.riders = state.riders.map(r => 
        r.id === rider.id ? updatedRider : r
      );
      newState.gameLog = [
        ...newState.gameLog,
        `💥 ${rider.name} CHUTE! Recule de 3 cases, +2 fatigue`
      ];
      newState.lastMovement = { type: 'fall', distance: -3 };
      
      return newState;
    } else {
      newState.gameLog = [
        ...newState.gameLog,
        `😅 ${rider.name} évite la chute!`
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
    return moveToNextPlayer(state);
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
  
  // Check if crossing finish line
  const crossingFinish = newPosition >= state.finishLine && !rider.hasFinished;
  
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
  
  let newState = {
    ...state,
    riders: ridersAfterAspiration,
    lastMovement: { type: 'move', distance: movement },
    ridersPlayedThisTurn: [...state.ridersPlayedThisTurn, rider.id],
    gameLog: [
      ...state.gameLog,
      `🚴 ${rider.name} avance de ${movement} cases → position ${newPosition + 1}`
    ]
  };
  
  // Check if this is the first finisher (triggers last turn)
  if (crossingFinish && !state.isLastTurn && !state.firstFinisher) {
    newState = {
      ...newState,
      isLastTurn: true,
      firstFinisher: updatedRider,
      phase: GamePhase.LAST_TURN,
      gameLog: [
        ...newState.gameLog,
        `🏁 ${rider.name} franchit la ligne en premier! DERNIER TOUR déclenché!`
      ]
    };
  } else if (crossingFinish) {
    newState.gameLog = [
      ...newState.gameLog,
      `🏁 ${rider.name} franchit la ligne d'arrivée!`
    ];
  }
  
  return moveToNextPlayer(newState);
}

/**
 * Move to next player or end turn
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function moveToNextPlayer(state) {
  const currentTeam = state.currentTeam;
  const otherTeam = getOtherTeam(currentTeam);
  
  // Check if other team has available riders
  if (teamHasAvailableRiders(state, otherTeam)) {
    // Switch to other team
    return {
      ...state,
      currentTeam: otherTeam,
      selectedRiderId: null,
      turnPhase: TurnPhase.SELECT_RIDER,
      attackUsedThisTurn: false,
      canReroll: false,
      lastCard: null,
      lastDiceRoll: null,
      lastMovement: null,
      gameLog: [
        ...state.gameLog,
        `🔄 Au tour de ${TeamConfig[otherTeam].playerName} (${TeamConfig[otherTeam].shortName})`
      ]
    };
  }
  
  // Check if current team still has riders
  if (teamHasAvailableRiders(state, currentTeam)) {
    // Stay with current team
    return {
      ...state,
      selectedRiderId: null,
      turnPhase: TurnPhase.SELECT_RIDER,
      attackUsedThisTurn: false,
      canReroll: false,
      lastCard: null,
      lastDiceRoll: null,
      lastMovement: null
    };
  }
  
  // Both teams have played all riders - end turn
  return endTurn(state);
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
  
  // If this was the last turn, game is over
  if (state.isLastTurn) {
    // Calculate final rankings based on position
    const rankings = [...ridersReset].sort((a, b) => b.position - a.position);
    
    rankings.forEach((rider, index) => {
      rider.finalRank = index + 1;
    });
    
    // Determine team winner
    const teamAScore = rankings
      .filter(r => r.team === Teams.TEAM_A)
      .slice(0, 3)
      .reduce((sum, r, i) => sum + (10 - i * 2), 0);
    const teamBScore = rankings
      .filter(r => r.team === Teams.TEAM_B)
      .slice(0, 3)
      .reduce((sum, r, i) => sum + (10 - i * 2), 0);
    
    const winningTeam = teamAScore > teamBScore ? Teams.TEAM_A : 
                        teamBScore > teamAScore ? Teams.TEAM_B : null;
    
    const resultsLog = [
      `\n══════════ 🏆 RÉSULTATS FINAUX ══════════`,
      ...rankings.slice(0, 10).map((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const team = TeamConfig[r.team]?.shortName || '';
        return `${medal} ${r.name} (${team}) - Position: ${r.position + 1}`;
      }),
      ``,
      winningTeam 
        ? `🎉 ${TeamConfig[winningTeam].name} remporte la course!`
        : `🤝 Égalité entre les équipes!`
    ];
    
    return {
      ...state,
      riders: ridersReset,
      phase: GamePhase.FINISHED,
      rankings,
      winningTeam,
      gameLog: [...state.gameLog, ...resultsLog]
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
  const availableRiders = getAvailableRiders(state, state.currentTeam);
  
  return {
    turn: state.currentTurn,
    phase: state.phase,
    turnPhase: state.turnPhase,
    isLastTurn: state.isLastTurn,
    currentTeam: state.currentTeam,
    currentTeamConfig: TeamConfig[state.currentTeam],
    selectedRiderId: state.selectedRiderId,
    availableRiders,
    currentRider: currentRider ? {
      ...currentRider,
      config: RiderConfig[currentRider.type],
      teamConfig: TeamConfig[currentRider.team],
      terrain: getTerrainAt(state, currentRider.position),
      terrainConfig: TerrainConfig[getTerrainAt(state, currentRider.position)],
      fatigueStatus: getFatiguePenalty(currentRider.fatigue),
      gapToLeader: getGapToLeader(currentRider, state.riders)
    } : null,
    groups,
    leader: state.riders.reduce((l, r) => r.position > l.position ? r : l, state.riders[0]),
    firstFinisher: state.firstFinisher,
    rankings: state.rankings,
    winningTeam: state.winningTeam,
    lastDiceRoll: state.lastDiceRoll,
    lastCard: state.lastCard,
    lastMovement: state.lastMovement,
    canAttack: currentRider && !state.attackUsedThisTurn && currentRider.attackCardsRemaining > 0,
    canReroll: state.canReroll,
    ridersPlayedThisTurn: state.ridersPlayedThisTurn
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
