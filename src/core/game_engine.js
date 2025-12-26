/**
 * Main game engine - v3 Card System
 * @module core/game_engine
 */

import { roll1D6, rollFallTest } from './dice.js';
import { TerrainType, TerrainConfig, DescentRules, getTerrainBonus, generateCourse, hasAspiration, hasWindPenalty } from './terrain.js';
import { 
  createRider, createTeamRiders, RiderConfig, CardType,
  playCard, playSpecialtyCard, addFatigueCard, recycleCards, needsRecycle,
  moveRider, getAvailableCards, getHandStats
} from './rider.js';

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
  return [
    ...createTeamRiders(Teams.TEAM_A, 'A'),
    ...createTeamRiders(Teams.TEAM_B, 'B')
  ];
}

/**
 * Create initial game state
 * @param {Object} options - Game options
 * @returns {Object} Initial game state
 */
export function createGameState(options = {}) {
  const {
    courseLength = 80,
    twoTeams = true
  } = options;
  
  const course = generateCourse(courseLength);
  const riders = createTwoTeamsRiders();
  
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
  if (position < 0) {
    return TerrainType.FLAT;
  }
  return state.course[position]?.terrain || TerrainType.FLAT;
}

/**
 * Get the other team
 */
export function getOtherTeam(team) {
  return team === Teams.TEAM_A ? Teams.TEAM_B : Teams.TEAM_A;
}

/**
 * Get available riders for a team
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
  let updatedRiders = state.riders.map(rider => {
    if (needsRecycle(rider)) {
      const recycled = recycleCards(rider);
      return recycled;
    }
    return rider;
  });
  
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
    gameLog: [
      ...state.gameLog, 
      turnHeader,
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
      // Apply fall
      let updatedRider = {
        ...rider,
        position: Math.max(0, rider.position - DescentRules.fallPenalty),
        hasFallenThisTurn: true
      };
      // Add fatigue cards
      updatedRider = addFatigueCard(updatedRider, 1);
      updatedRider = addFatigueCard(updatedRider, 1);
      
      newState.riders = state.riders.map(r => 
        r.id === rider.id ? updatedRider : r
      );
      newState.gameLog = [
        ...newState.gameLog,
        `💥 ${rider.name} CHUTE! Recule de ${DescentRules.fallPenalty} cases, +2 cartes fatigue`
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
  
  return {
    ...state,
    selectedSpecialtyId: cardId,
    turnPhase: TurnPhase.RESOLVE
  };
}

/**
 * Calculate movement for current rider
 */
export function calculateMovement(state) {
  const rider = getCurrentRider(state);
  if (!rider || !state.lastDiceRoll || !state.selectedCardId) return 0;
  
  const terrain = getTerrainAt(state, rider.position);
  
  // Base: dice
  let movement = state.lastDiceRoll.result;
  
  // Find selected card
  const cardInHand = rider.hand.find(c => c.id === state.selectedCardId);
  const cardInAttack = rider.attackCards.find(c => c.id === state.selectedCardId);
  const selectedCard = cardInHand || cardInAttack;
  
  if (selectedCard) {
    movement += selectedCard.value;
  }
  
  // Terrain bonus
  movement += getTerrainBonus(terrain, rider.type);
  
  // Specialty card bonus
  if (state.selectedSpecialtyId) {
    const specialtyCard = rider.specialtyCards.find(c => c.id === state.selectedSpecialtyId);
    if (specialtyCard) {
      movement += specialtyCard.value;
    }
  }
  
  // Descent minimum speed
  if (terrain === TerrainType.DESCENT) {
    movement = Math.max(movement, DescentRules.minSpeed);
  }
  
  return Math.max(1, movement);
}

/**
 * Resolve movement and apply effects
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
  
  const terrain = getTerrainAt(state, rider.position);
  const movement = calculateMovement(state);
  const newPosition = rider.position + movement;
  
  // Play the selected card
  let updatedRider = rider;
  const { rider: riderAfterCard, card: playedCard } = playCard(rider, state.selectedCardId);
  updatedRider = riderAfterCard;
  
  // Play specialty card if selected
  if (state.selectedSpecialtyId) {
    const { rider: riderAfterSpecialty } = playSpecialtyCard(updatedRider, state.selectedSpecialtyId);
    updatedRider = riderAfterSpecialty;
  }
  
  // Move rider
  const crossingFinish = newPosition >= state.finishLine && !rider.hasFinished;
  updatedRider = moveRider(updatedRider, newPosition, state.finishLine);
  
  // Update riders array
  let updatedRiders = state.riders.map(r => 
    r.id === rider.id ? updatedRider : r
  );
  
  // Build log message
  let logMessage = `🚴 ${rider.name} joue ${playedCard?.name || 'carte'} (+${playedCard?.value || 0})`;
  if (state.selectedSpecialtyId) {
    logMessage += ` + Spécialité (+2)`;
  }
  logMessage += ` + 🎲${state.lastDiceRoll.result} → ${movement} cases (position ${newPosition + 1})`;
  
  let newState = {
    ...state,
    riders: updatedRiders,
    lastMovement: { type: 'move', distance: movement },
    ridersPlayedThisTurn: [...state.ridersPlayedThisTurn, rider.id],
    gameLog: [...state.gameLog, logMessage]
  };
  
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
  
  // Apply wind/aspiration effects (from turn 2 onwards)
  if (state.currentTurn >= 2 && hasWindPenalty(terrain)) {
    newState = applyWindAndAspirationEffects(newState, rider.id, newPosition);
  }
  
  // Apply regrouping
  if (hasAspiration(terrain)) {
    newState = applyRegrouping(newState);
  }
  
  return moveToNextPlayer(newState);
}

/**
 * Apply wind and aspiration fatigue cards
 */
function applyWindAndAspirationEffects(state, riderId, riderPosition) {
  const rider = state.riders.find(r => r.id === riderId);
  const terrain = getTerrainAt(state, riderPosition);
  
  if (!hasWindPenalty(terrain)) return state;
  
  // Find riders ahead
  const ridersAhead = state.riders.filter(r => 
    r.id !== riderId && 
    r.position > riderPosition &&
    !r.hasFinished
  );
  
  // Find closest rider ahead
  const closestAhead = ridersAhead.length > 0 
    ? ridersAhead.reduce((closest, r) => 
        r.position < closest.position ? r : closest
      )
    : null;
  
  // Find riders behind (in aspiration range)
  const ridersBehind = state.riders.filter(r =>
    r.id !== riderId &&
    r.position === riderPosition - 1 &&
    !r.hasFinished
  );
  
  let updatedRiders = [...state.riders];
  let logMessages = [];
  
  // Check if taking wind
  const takingWind = !closestAhead || (closestAhead.position - riderPosition >= 2);
  
  if (takingWind) {
    // Add +1 fatigue card
    const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
    updatedRiders[riderIndex] = addFatigueCard(updatedRiders[riderIndex], 1);
    logMessages.push(`💨 ${rider.name} prend le vent (+1 fatigue)`);
  } else if (closestAhead && closestAhead.position - riderPosition === 1) {
    // In aspiration - add +2 fatigue card (better than +1)
    const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
    updatedRiders[riderIndex] = addFatigueCard(updatedRiders[riderIndex], 2);
    logMessages.push(`🌀 ${rider.name} dans l'aspiration (+2 fatigue)`);
  }
  
  // Check if leading aspiration (someone in our wheel)
  if (ridersBehind.length > 0) {
    const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
    updatedRiders[riderIndex] = addFatigueCard(updatedRiders[riderIndex], 1);
    logMessages.push(`🚂 ${rider.name} mène le groupe (+1 fatigue)`);
  }
  
  return {
    ...state,
    riders: updatedRiders,
    gameLog: [...state.gameLog, ...logMessages]
  };
}

/**
 * Apply regrouping at end of movement
 */
function applyRegrouping(state) {
  // Sort riders by position (descending)
  const sortedRiders = [...state.riders].sort((a, b) => b.position - a.position);
  
  let updatedRiders = [...state.riders];
  let regrouped = false;
  
  // Check for 1-case gaps and close them
  for (let i = 0; i < sortedRiders.length - 1; i++) {
    const ahead = sortedRiders[i];
    const behind = sortedRiders[i + 1];
    
    if (ahead.hasFinished || behind.hasFinished) continue;
    
    const gap = ahead.position - behind.position;
    
    if (gap === 1) {
      // Close the gap - move behind rider up
      const behindIndex = updatedRiders.findIndex(r => r.id === behind.id);
      updatedRiders[behindIndex] = {
        ...updatedRiders[behindIndex],
        position: ahead.position
      };
      regrouped = true;
    }
  }
  
  if (regrouped) {
    return {
      ...state,
      riders: updatedRiders,
      gameLog: [...state.gameLog, `🔄 Regroupement automatique`]
    };
  }
  
  return state;
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
  
  // Both teams have played all riders - end turn
  return endTurn(state);
}

/**
 * End current turn
 */
export function endTurn(state) {
  // Reset fallen flags
  const ridersReset = state.riders.map(r => ({
    ...r,
    hasFallenThisTurn: false
  }));
  
  // If last turn, game is over
  if (state.isLastTurn) {
    const rankings = [...ridersReset].sort((a, b) => b.position - a.position);
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
        return `${medal} ${r.name} (${TeamConfig[r.team]?.shortName}) - Position: ${r.position + 1}`;
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
  getHandStats
};
