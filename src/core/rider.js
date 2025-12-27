/**
 * Rider types, cards, and management - v3 Card System
 * @module core/rider
 */

/**
 * Rider type enumeration
 */
export const RiderType = {
  CLIMBER: 'climber',
  PUNCHER: 'puncher',
  ROULEUR: 'rouleur',
  SPRINTER: 'sprinter',
  VERSATILE: 'versatile'
};

/**
 * Rider type display configuration
 */
export const RiderConfig = {
  [RiderType.CLIMBER]: {
    name: 'Grimpeur',
    emoji: '🧗',
    color: '#CD853F',
    specialtyTerrain: 'mountain'
  },
  [RiderType.PUNCHER]: {
    name: 'Puncheur',
    emoji: '💥',
    color: '#FF6347',
    specialtyTerrain: 'hill'
  },
  [RiderType.ROULEUR]: {
    name: 'Rouleur',
    emoji: '🚴',
    color: '#4169E1',
    specialtyTerrain: 'flat'
  },
  [RiderType.SPRINTER]: {
    name: 'Sprinteur',
    emoji: '⚡',
    color: '#32CD32',
    specialtyTerrain: 'sprint'
  },
  [RiderType.VERSATILE]: {
    name: 'Polyvalent',
    emoji: '🎯',
    color: '#9370DB',
    specialtyTerrain: 'all' // Can use specialty on any terrain
  }
};

/**
 * Card types
 */
export const CardType = {
  MOVEMENT: 'movement',
  ATTACK: 'attack',
  SPECIALTY: 'specialty',
  FATIGUE: 'fatigue'
};

/**
 * Create a movement card
 * @param {number} value - Card value (2-5)
 * @param {string} name - Card name
 * @param {string} color - Display color
 * @returns {Object} Card object
 */
export function createMovementCard(value, name, color) {
  return {
    type: CardType.MOVEMENT,
    value,
    name,
    color,
    id: `mov_${value}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Create an attack card
 * @returns {Object} Card object
 */
export function createAttackCard() {
  return {
    type: CardType.ATTACK,
    value: 6,
    name: 'Attaque',
    color: '#dc2626',
    id: `atk_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Create a specialty card
 * @param {string} terrain - Terrain where it can be used
 * @returns {Object} Card object
 */
export function createSpecialtyCard(terrain) {
  return {
    type: CardType.SPECIALTY,
    value: 2,
    name: 'Spécialité',
    terrain,
    color: '#8b5cf6',
    id: `spe_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Create a fatigue card
 * @param {number} value - Card value (1 or 2)
 * @returns {Object} Card object
 */
export function createFatigueCard(value) {
  return {
    type: CardType.FATIGUE,
    value,
    name: value === 1 ? 'Fatigue' : 'Fatigue+',
    color: '#6b7280',
    id: `fat_${value}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Create initial movement cards for a rider
 * @returns {Array} Array of 6 movement cards
 */
export function createInitialMovementCards() {
  return [
    createMovementCard(2, 'Tempo', '#e5e7eb'),
    createMovementCard(3, 'Rythme', '#fef08a'),
    createMovementCard(3, 'Rythme', '#fef08a'),
    createMovementCard(4, 'Accélération', '#fed7aa'),
    createMovementCard(4, 'Accélération', '#fed7aa'),
    createMovementCard(5, 'Sprint', '#fecaca')
  ];
}

/**
 * Create a new rider with full card set
 * @param {string} id - Unique identifier
 * @param {string} type - Rider type
 * @param {string} name - Display name
 * @param {string} team - Team identifier
 * @returns {Object} Rider object
 */
export function createRider(id, type, name, team = 'default') {
  const specialtyTerrain = RiderConfig[type].specialtyTerrain;
  
  return {
    id,
    type,
    name,
    team,
    position: 0,
    hasFinished: false,
    finishPosition: null,
    hasFallenThisTurn: false,
    turnsToSkip: 0,
    
    // Card system v3
    hand: createInitialMovementCards(),
    attackCards: [createAttackCard(), createAttackCard()],
    specialtyCards: [
      createSpecialtyCard(specialtyTerrain),
      createSpecialtyCard(specialtyTerrain)
    ],
    discard: [],
    
    // Track cards played this game
    attacksUsed: 0,
    specialtiesUsed: 0
  };
}

/**
 * Get all available cards for a rider (hand + attack + specialty)
 * @param {Object} rider - Rider object
 * @param {string} currentTerrain - Current terrain type
 * @returns {Object} Available cards by type
 */
export function getAvailableCards(rider, currentTerrain) {
  const specialtyTerrain = RiderConfig[rider.type].specialtyTerrain;
  const canUseSpecialty = specialtyTerrain === 'all' || specialtyTerrain === currentTerrain;
  
  return {
    movement: rider.hand,
    attack: rider.attackCards,
    specialty: canUseSpecialty ? rider.specialtyCards : [],
    canUseSpecialty
  };
}

/**
 * Play a movement or attack card
 * @param {Object} rider - Rider object
 * @param {string} cardId - ID of card to play
 * @returns {{rider: Object, card: Object|null, success: boolean}}
 */
export function playCard(rider, cardId) {
  // Check in hand
  let cardIndex = rider.hand.findIndex(c => c.id === cardId);
  if (cardIndex !== -1) {
    const card = rider.hand[cardIndex];
    const newHand = [...rider.hand];
    newHand.splice(cardIndex, 1);
    
    return {
      rider: {
        ...rider,
        hand: newHand,
        discard: [...rider.discard, card]
      },
      card,
      success: true
    };
  }
  
  // Check in attack cards
  cardIndex = rider.attackCards.findIndex(c => c.id === cardId);
  if (cardIndex !== -1) {
    const card = rider.attackCards[cardIndex];
    const newAttackCards = [...rider.attackCards];
    newAttackCards.splice(cardIndex, 1);
    
    return {
      rider: {
        ...rider,
        attackCards: newAttackCards,
        attacksUsed: rider.attacksUsed + 1
      },
      card,
      success: true
    };
  }
  
  return { rider, card: null, success: false };
}

/**
 * Play a specialty card (bonus, not replacement)
 * @param {Object} rider - Rider object
 * @param {string} cardId - ID of card to play
 * @returns {{rider: Object, card: Object|null, success: boolean}}
 */
export function playSpecialtyCard(rider, cardId) {
  const cardIndex = rider.specialtyCards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return { rider, card: null, success: false };
  }
  
  const card = rider.specialtyCards[cardIndex];
  const newSpecialtyCards = [...rider.specialtyCards];
  newSpecialtyCards.splice(cardIndex, 1);
  
  return {
    rider: {
      ...rider,
      specialtyCards: newSpecialtyCards,
      specialtiesUsed: rider.specialtiesUsed + 1
    },
    card,
    success: true
  };
}

/**
 * Add a fatigue card to rider's discard
 * @param {Object} rider - Rider object
 * @param {number} value - Fatigue value (1 or 2)
 * @returns {Object} Updated rider
 */
export function addFatigueCard(rider, value) {
  const fatigueCard = createFatigueCard(value);
  return {
    ...rider,
    discard: [...rider.discard, fatigueCard]
  };
}

/**
 * Recycle discard pile into hand when hand is empty
 * @param {Object} rider - Rider object
 * @returns {Object} Updated rider
 */
export function recycleCards(rider) {
  if (rider.hand.length > 0) {
    return rider; // Hand not empty, no need to recycle
  }
  
  if (rider.discard.length === 0) {
    return rider; // Nothing to recycle
  }
  
  // Shuffle discard pile
  const shuffled = [...rider.discard].sort(() => Math.random() - 0.5);
  
  return {
    ...rider,
    hand: shuffled,
    discard: []
  };
}

/**
 * Check if rider needs to recycle cards
 * @param {Object} rider - Rider object
 * @returns {boolean}
 */
export function needsRecycle(rider) {
  return rider.hand.length === 0 && rider.discard.length > 0;
}

/**
 * Get hand statistics for display
 * @param {Object} rider - Rider object
 * @returns {Object} Hand stats
 */
export function getHandStats(rider) {
  const handValues = rider.hand.map(c => c.value);
  const discardValues = rider.discard.map(c => c.value);
  
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const avg = arr => arr.length > 0 ? sum(arr) / arr.length : 0;
  
  return {
    handSize: rider.hand.length,
    handAverage: avg(handValues).toFixed(1),
    handMin: handValues.length > 0 ? Math.min(...handValues) : 0,
    handMax: handValues.length > 0 ? Math.max(...handValues) : 0,
    discardSize: rider.discard.length,
    discardAverage: avg(discardValues).toFixed(1),
    attacksRemaining: rider.attackCards.length,
    specialtiesRemaining: rider.specialtyCards.length,
    fatigueCards: rider.discard.filter(c => c.type === CardType.FATIGUE).length
  };
}

/**
 * Move rider to a new position
 * @param {Object} rider - Rider object
 * @param {number} newPosition - New position
 * @param {number} finishLine - Finish line position
 * @returns {Object} Updated rider
 */
export function moveRider(rider, newPosition, finishLine) {
  const hasFinished = newPosition >= finishLine;
  
  return {
    ...rider,
    position: newPosition,
    hasFinished,
    finishPosition: hasFinished ? newPosition : null
  };
}

/**
 * Create default set of 5 riders for a team
 * @param {string} teamId - Team identifier
 * @param {string} teamSuffix - Suffix for rider names (A or B)
 * @returns {Array<Object>} Array of riders
 */
export function createTeamRiders(teamId, teamSuffix) {
  const riderTypes = ['climber', 'puncher', 'rouleur', 'sprinter', 'versatile'];
  
  return riderTypes.map((type, index) => 
    createRider(
      `${teamId}_${index + 1}`,
      type,
      `${RiderConfig[type].name} ${teamSuffix}`,
      teamId
    )
  );
}
