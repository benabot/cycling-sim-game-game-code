/**
 * Terrain types and bonuses
 * @module core/terrain
 */

/**
 * Terrain type enumeration
 */
export const TerrainType = {
  FLAT: 'flat',
  HILL: 'hill',
  MOUNTAIN: 'mountain',
  DESCENT: 'descent',
  SPRINT: 'sprint'
};

/**
 * Terrain display configuration
 */
export const TerrainConfig = {
  [TerrainType.FLAT]: {
    name: 'Plaine',
    color: '#90EE90',
    emoji: '🟩',
    hasAspiration: true,
    hasWindPenalty: true
  },
  [TerrainType.HILL]: {
    name: 'Côte',
    color: '#FFD700',
    emoji: '🟨',
    hasAspiration: true,
    hasWindPenalty: true
  },
  [TerrainType.MOUNTAIN]: {
    name: 'Montagne',
    color: '#CD853F',
    emoji: '🟫',
    hasAspiration: false,
    hasWindPenalty: false
  },
  [TerrainType.DESCENT]: {
    name: 'Descente',
    color: '#87CEEB',
    emoji: '🟦',
    hasAspiration: false,
    hasWindPenalty: false
  },
  [TerrainType.SPRINT]: {
    name: 'Sprint',
    color: '#FF69B4',
    emoji: '🟪',
    hasAspiration: true,
    hasWindPenalty: true
  }
};

/**
 * Terrain bonuses by rider type
 * terrainBonuses[terrain][riderType] = bonus
 */
export const TerrainBonuses = {
  [TerrainType.FLAT]: {
    climber: 0,
    puncher: 0,
    rouleur: 2,
    sprinter: 1,
    versatile: 0
  },
  [TerrainType.HILL]: {
    climber: 1,
    puncher: 2,
    rouleur: 0,
    sprinter: -1,
    versatile: 0
  },
  [TerrainType.MOUNTAIN]: {
    climber: 2,
    puncher: 1,
    rouleur: -1,
    sprinter: -2,
    versatile: 0
  },
  [TerrainType.DESCENT]: {
    climber: 0,
    puncher: 0,
    rouleur: 1,
    sprinter: 1,
    versatile: 0
  },
  [TerrainType.SPRINT]: {
    climber: -1,
    puncher: 0,
    rouleur: 0,
    sprinter: 3,
    versatile: 0
  }
};

/**
 * Descent specific rules
 */
export const DescentRules = {
  bonusAll: 3,           // +3 for everyone in descent
  minSpeed: 5,           // Minimum 5 cases in descent
  recoveryInPeloton: 1   // -1 fatigue if in peloton
};

/**
 * Get terrain bonus for a rider type
 * @param {string} terrain - Terrain type
 * @param {string} riderType - Rider type
 * @returns {number} Bonus value
 */
export function getTerrainBonus(terrain, riderType) {
  const bonus = TerrainBonuses[terrain]?.[riderType] ?? 0;
  
  // Add descent bonus for all riders
  if (terrain === TerrainType.DESCENT) {
    return bonus + DescentRules.bonusAll;
  }
  
  return bonus;
}

/**
 * Check if terrain has aspiration
 * @param {string} terrain - Terrain type
 * @returns {boolean}
 */
export function hasAspiration(terrain) {
  return TerrainConfig[terrain]?.hasAspiration ?? false;
}

/**
 * Check if terrain has wind penalty
 * @param {string} terrain - Terrain type
 * @returns {boolean}
 */
export function hasWindPenalty(terrain) {
  return TerrainConfig[terrain]?.hasWindPenalty ?? false;
}

/**
 * Generate a course with specified terrain distribution
 * @param {number} totalCases - Total number of cases
 * @param {Object} distribution - Terrain distribution {flat: 10, hill: 10, ...}
 * @returns {Array<{position: number, terrain: string}>}
 */
export function generateCourse(totalCases, distribution) {
  const course = [];
  let position = 0;
  
  // Default distribution for 50 cases
  const defaultDistribution = {
    [TerrainType.FLAT]: 10,
    [TerrainType.HILL]: 10,
    [TerrainType.MOUNTAIN]: 15,
    [TerrainType.DESCENT]: 10,
    [TerrainType.SPRINT]: 5
  };
  
  const dist = distribution || defaultDistribution;
  
  // Build course in order: flat -> hill -> mountain -> descent -> sprint
  const order = [
    TerrainType.FLAT,
    TerrainType.HILL,
    TerrainType.MOUNTAIN,
    TerrainType.DESCENT,
    TerrainType.SPRINT
  ];
  
  for (const terrain of order) {
    const count = dist[terrain] || 0;
    for (let i = 0; i < count && position < totalCases; i++) {
      course.push({
        position: position++,
        terrain
      });
    }
  }
  
  return course;
}
