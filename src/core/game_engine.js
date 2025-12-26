/**
 * Main game engine - v3 Card System
 * @module core/game_engine
 */

import { roll1D6, rollFallTest } from './dice.js';
import { TerrainType, TerrainConfig, DescentRules, getTerrainBonus, generateCourse, hasAspiration, hasWindPenalty } from './terrain.js';
import { 
  createRider, createTeamRiders, RiderConfig, CardType,
  playCard, playSpecialtyCard, addFatigueCard, recycleCards, needsRecycle,
  moveRider, getAvailableCards, getHandStats, createMovementCard
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
  END_TURN_EFFECTS: 'end_turn_effects',
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
    
    // Riders (all start at position 0)
    riders: riders.map(r => ({ ...r, position: 0 })),
    
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
      return recycleCards(rider);
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
    endTurnEffects: [],
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
  logMessage += ` + 🎲${state.lastDiceRoll.result} → ${movement} cases (case ${newPosition})`;
  
  let newState = {
    ...state,
    riders: updatedRiders,
    lastMovement: { type: 'move', distance: movement, newPosition },
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
  
  // Sort riders by position (descending) for processing
  const sortedRiderIds = updatedRiders
    .filter(r => !r.hasFinished)
    .sort((a, b) => b.position - a.position)
    .map(r => r.id);
  
  // ===== PHASE 1: ASPIRATION (regroupement) =====
  // Find groups and gaps
  let regroupingOccurred = true;
  let iterations = 0;
  
  while (regroupingOccurred && iterations < 10) {
    regroupingOccurred = false;
    iterations++;
    
    // Get positions sorted
    const positions = updatedRiders
      .filter(r => !r.hasFinished)
      .map(r => r.position)
      .sort((a, b) => b - a);
    
    const uniquePositions = [...new Set(positions)].sort((a, b) => b - a);
    
    for (let i = 0; i < uniquePositions.length - 1; i++) {
      const frontPos = uniquePositions[i];
      const backPos = uniquePositions[i + 1];
      const gap = frontPos - backPos;
      
      // Check terrain - no aspiration in mountain
      const terrainAtFront = getTerrainAt(state, frontPos);
      const terrainAtBack = getTerrainAt(state, backPos);
      
      if (!hasAspiration(terrainAtFront) || !hasAspiration(terrainAtBack)) {
        continue;
      }
      
      // If gap is exactly 1, riders behind move up
      if (gap === 1) {
        const ridersToMove = updatedRiders.filter(r => 
          r.position === backPos && !r.hasFinished
        );
        
        if (ridersToMove.length > 0) {
          ridersToMove.forEach(rider => {
            const riderIndex = updatedRiders.findIndex(r => r.id === rider.id);
            updatedRiders[riderIndex] = {
              ...updatedRiders[riderIndex],
              position: frontPos
            };
            
            effects.push({
              type: 'aspiration',
              riderId: rider.id,
              riderName: rider.name,
              fromPosition: backPos,
              toPosition: frontPos
            });
          });
          
          regroupingOccurred = true;
        }
      }
    }
  }
  
  if (effects.filter(e => e.type === 'aspiration').length > 0) {
    const aspirationRiders = effects
      .filter(e => e.type === 'aspiration')
      .map(e => e.riderName);
    logMessages.push(`🌀 Aspiration: ${aspirationRiders.join(', ')} rejoignent le groupe`);
  }
  
  // ===== PHASE 2: WIND CARDS (prise de vent) =====
  // Only from turn 2 onwards
  if (state.currentTurn >= 2) {
    // Recalculate positions after regrouping
    const finalPositions = updatedRiders
      .filter(r => !r.hasFinished)
      .map(r => ({ id: r.id, position: r.position }))
      .sort((a, b) => b.position - a.position);
    
    const uniqueFinalPositions = [...new Set(finalPositions.map(r => r.position))].sort((a, b) => b - a);
    
    // Find leaders (riders at front with 2+ gap to next group)
    const leadersIds = [];
    const shelteredIds = [];
    
    for (let i = 0; i < uniqueFinalPositions.length; i++) {
      const pos = uniqueFinalPositions[i];
      const nextPos = uniqueFinalPositions[i + 1];
      const terrain = getTerrainAt(state, pos);
      
      // Skip if in mountain or descent (no wind penalty)
      if (!hasWindPenalty(terrain)) {
        continue;
      }
      
      const ridersAtPos = updatedRiders.filter(r => r.position === pos && !r.hasFinished);
      
      if (i === 0) {
        // Front group
        if (nextPos === undefined || pos - nextPos >= 2) {
          // Leaders take wind
          ridersAtPos.forEach(r => leadersIds.push(r.id));
        } else {
          // Close to next group - sheltered
          ridersAtPos.forEach(r => shelteredIds.push(r.id));
        }
      } else {
        // Not front group - check gap with group ahead
        const prevPos = uniqueFinalPositions[i - 1];
        if (prevPos - pos >= 2) {
          // 2+ gap - this group's leader takes wind
          // Only first rider if alone, or all if it's an isolated group
          ridersAtPos.forEach(r => leadersIds.push(r.id));
        } else {
          // Sheltered
          ridersAtPos.forEach(r => shelteredIds.push(r.id));
        }
      }
    }
    
    // Apply wind cards (+1) to leaders
    leadersIds.forEach(riderId => {
      const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
      if (riderIndex !== -1) {
        const rider = updatedRiders[riderIndex];
        const windCard = createMovementCard(1, 'Prise de vent', '#94a3b8');
        
        updatedRiders[riderIndex] = {
          ...rider,
          hand: [...rider.hand, windCard]
        };
        
        effects.push({
          type: 'wind',
          riderId: rider.id,
          riderName: rider.name,
          cardValue: 1
        });
      }
    });
    
    // Apply bonus cards (+2) to sheltered riders
    shelteredIds.forEach(riderId => {
      const riderIndex = updatedRiders.findIndex(r => r.id === riderId);
      if (riderIndex !== -1) {
        const rider = updatedRiders[riderIndex];
        const bonusCard = createMovementCard(2, 'Abri', '#86efac');
        
        updatedRiders[riderIndex] = {
          ...rider,
          hand: [...rider.hand, bonusCard]
        };
        
        effects.push({
          type: 'shelter',
          riderId: rider.id,
          riderName: rider.name,
          cardValue: 2
        });
      }
    });
    
    if (leadersIds.length > 0) {
      const windRiders = effects
        .filter(e => e.type === 'wind')
        .map(e => e.riderName);
      logMessages.push(`💨 Prise de vent: ${windRiders.join(', ')} reçoivent une carte +1`);
    }
    
    if (shelteredIds.length > 0) {
      const shelterRiders = effects
        .filter(e => e.type === 'shelter')
        .map(e => e.riderName);
      logMessages.push(`🛡️ À l'abri: ${shelterRiders.join(', ')} reçoivent une carte +2`);
    }
  }
  
  // Return state with effects for animation
  return {
    ...state,
    riders: updatedRiders,
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
  getHandStats
};
