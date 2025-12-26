/**
 * Rider types and management
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
    color: '#CD853F'
  },
  [RiderType.PUNCHER]: {
    name: 'Puncheur',
    emoji: '💥',
    color: '#FF6347'
  },
  [RiderType.ROULEUR]: {
    name: 'Rouleur',
    emoji: '🚴',
    color: '#4169E1'
  },
  [RiderType.SPRINTER]: {
    name: 'Sprinteur',
    emoji: '⚡',
    color: '#32CD32'
  },
  [RiderType.VERSATILE]: {
    name: 'Polyvalent',
    emoji: '🎯',
    color: '#9370DB'
  }
};

/**
 * Initial rider stats
 */
export const InitialStats = {
  endurance: 10,
  attackCards: 2
};

/**
 * Fatigue thresholds and effects
 */
export const FatigueThresholds = {
  OK: { max: 3, penalty: 0 },
  TIRED: { max: 6, penalty: -1 },
  EXHAUSTED: { max: 9, penalty: -2 },
  FRINGALE: { max: Infinity, penalty: -99, maxMove: 4 }
};

/**
 * Create a new rider
 * @param {string} id - Unique identifier
 * @param {string} type - Rider type
 * @param {string} name - Display name
 * @param {string} team - Team identifier
 * @returns {Object} Rider object
 */
export function createRider(id, type, name, team = 'default') {
  return {
    id,
    type,
    name,
    team,
    position: 0,
    fatigue: 0,
    attackCardsRemaining: InitialStats.attackCards,
    hasFinished: false,
    finishPosition: null,
    hasFallenThisTurn: false,
    isInPeloton: true
  };
}

/**
 * Get fatigue penalty for current fatigue level
 * @param {number} fatigue - Current fatigue
 * @returns {{penalty: number, status: string, maxMove: number|null}}
 */
export function getFatiguePenalty(fatigue) {
  if (fatigue <= FatigueThresholds.OK.max) {
    return { penalty: 0, status: 'OK', maxMove: null };
  }
  if (fatigue <= FatigueThresholds.TIRED.max) {
    return { penalty: FatigueThresholds.TIRED.penalty, status: 'Fatigué', maxMove: null };
  }
  if (fatigue <= FatigueThresholds.EXHAUSTED.max) {
    return { penalty: FatigueThresholds.EXHAUSTED.penalty, status: 'Épuisé', maxMove: null };
  }
  return { 
    penalty: 0, // No penalty but max move limited
    status: 'Fringale', 
    maxMove: FatigueThresholds.FRINGALE.maxMove 
  };
}

/**
 * Add fatigue to a rider
 * @param {Object} rider - Rider object
 * @param {number} amount - Amount to add
 * @returns {Object} Updated rider
 */
export function addFatigue(rider, amount) {
  return {
    ...rider,
    fatigue: Math.max(0, rider.fatigue + amount)
  };
}

/**
 * Remove fatigue from a rider (recovery)
 * @param {Object} rider - Rider object
 * @param {number} amount - Amount to remove
 * @returns {Object} Updated rider
 */
export function removeFatigue(rider, amount) {
  return {
    ...rider,
    fatigue: Math.max(0, rider.fatigue - amount)
  };
}

/**
 * Use an attack card
 * @param {Object} rider - Rider object
 * @returns {{rider: Object, success: boolean}}
 */
export function useAttackCard(rider) {
  if (rider.attackCardsRemaining <= 0) {
    return { rider, success: false };
  }
  
  // Check for fringale
  const fatigueStatus = getFatiguePenalty(rider.fatigue);
  if (fatigueStatus.status === 'Fringale') {
    return { rider, success: false };
  }
  
  return {
    rider: {
      ...rider,
      attackCardsRemaining: rider.attackCardsRemaining - 1,
      fatigue: rider.fatigue + 1  // Attack costs 1 fatigue
    },
    success: true
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
 * Create default set of 5 riders for testing
 * @returns {Array<Object>} Array of riders
 */
export function createTestRiders() {
  return [
    createRider('r1', RiderType.CLIMBER, 'Grimpeur', 'team1'),
    createRider('r2', RiderType.PUNCHER, 'Puncheur', 'team1'),
    createRider('r3', RiderType.ROULEUR, 'Rouleur', 'team1'),
    createRider('r4', RiderType.SPRINTER, 'Sprinteur', 'team1'),
    createRider('r5', RiderType.VERSATILE, 'Polyvalent', 'team1')
  ];
}
