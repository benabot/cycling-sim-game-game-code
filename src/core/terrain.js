/**
 * Terrain types and course generation - v3 (80 cases)
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
    emoji: '🟩',
    color: '#90EE90',
    hasAspiration: true,
    hasWindPenalty: true
  },
  [TerrainType.HILL]: {
    name: 'Côte',
    emoji: '🟨',
    color: '#FFD700',
    hasAspiration: true,
    hasWindPenalty: true
  },
  [TerrainType.MOUNTAIN]: {
    name: 'Montagne',
    emoji: '🟫',
    color: '#CD853F',
    hasAspiration: false,
    hasWindPenalty: false
  },
  [TerrainType.DESCENT]: {
    name: 'Descente',
    emoji: '🟦',
    color: '#87CEEB',
    hasAspiration: false,
    hasWindPenalty: false
  },
  [TerrainType.SPRINT]: {
    name: 'Sprint',
    emoji: '🟪',
    color: '#FF69B4',
    hasAspiration: true,
    hasWindPenalty: true
  }
};

/**
 * Terrain bonus matrix by rider type (v3 - adjusted for 1d6)
 * Positive = bonus, Negative = malus
 */
export const TerrainBonus = {
  [TerrainType.FLAT]: {
    climber: 0,
    puncher: 0,
    rouleur: 1,
    sprinter: 0,
    versatile: 0
  },
  [TerrainType.HILL]: {
    climber: 1,
    puncher: 1,
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
    climber: 2,
    puncher: 2,
    rouleur: 3,
    sprinter: 3,
    versatile: 2
  },
  [TerrainType.SPRINT]: {
    climber: -1,
    puncher: 0,
    rouleur: 0,
    sprinter: 2,
    versatile: 0
  }
};

/**
 * Descent specific rules
 */
export const DescentRules = {
  minSpeed: 4,           // Minimum movement in descent
  fallTestThreshold: 1,  // Roll this on d6 to trigger fall test
  fallRisk: [1, 2],      // Roll these on fall test = fall
  fallPenalty: 3,        // Cases to go back on fall
  fallFatigue: 2         // Fatigue cards to add on fall (2x +1)
};

/**
 * Get terrain bonus for a rider type
 * @param {string} terrain - Terrain type
 * @param {string} riderType - Rider type
 * @returns {number} Bonus value
 */
export function getTerrainBonus(terrain, riderType) {
  return TerrainBonus[terrain]?.[riderType] ?? 0;
}

/**
 * Check if terrain has aspiration active
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
 * Default course distribution for 80 cases
 */
export const DefaultCourseDistribution = {
  [TerrainType.FLAT]: 25,      // 31%
  [TerrainType.HILL]: 15,      // 19%
  [TerrainType.MOUNTAIN]: 20,  // 25%
  [TerrainType.DESCENT]: 12,   // 15%
  [TerrainType.SPRINT]: 8      // 10%
};

/**
 * Generate a course with terrain segments
 * @param {number} length - Course length (default 80)
 * @param {Object} distribution - Custom terrain distribution
 * @returns {Array} Course array with terrain info
 */
export function generateCourse(length = 80, distribution = null) {
  const dist = distribution || DefaultCourseDistribution;
  const course = [];
  
  // Create terrain pool based on distribution
  const terrainPool = [];
  for (const [terrain, count] of Object.entries(dist)) {
    for (let i = 0; i < count; i++) {
      terrainPool.push(terrain);
    }
  }
  
  // Adjust pool size to match course length
  while (terrainPool.length < length) {
    terrainPool.push(TerrainType.FLAT);
  }
  while (terrainPool.length > length) {
    terrainPool.pop();
  }
  
  // Create logical course structure
  // Start with flat, end with sprint zone
  const courseStructure = createCourseStructure(length, dist);
  
  for (let i = 0; i < length; i++) {
    course.push({
      index: i,
      terrain: courseStructure[i],
      config: TerrainConfig[courseStructure[i]]
    });
  }
  
  return course;
}

/**
 * Create a logical course structure (realistic race progression)
 * @param {number} length - Course length
 * @param {Object} dist - Terrain distribution
 * @returns {Array} Array of terrain types
 */
function createCourseStructure(length, dist) {
  const structure = new Array(length);
  
  // Reserve last 8 cases for sprint zone
  const sprintStart = length - 8;
  for (let i = sprintStart; i < length; i++) {
    structure[i] = TerrainType.SPRINT;
  }
  
  // Reserve first 5 cases for flat (neutral start)
  for (let i = 0; i < 5; i++) {
    structure[i] = TerrainType.FLAT;
  }
  
  // Remaining terrain to distribute
  const remaining = {
    [TerrainType.FLAT]: dist[TerrainType.FLAT] - 5,
    [TerrainType.HILL]: dist[TerrainType.HILL],
    [TerrainType.MOUNTAIN]: dist[TerrainType.MOUNTAIN],
    [TerrainType.DESCENT]: dist[TerrainType.DESCENT],
    [TerrainType.SPRINT]: 0 // Already placed
  };
  
  // Create segments for middle section
  const middleLength = sprintStart - 5;
  const segments = [];
  
  // Create mountain + descent pairs
  const mountainDescents = Math.min(
    Math.floor(remaining[TerrainType.MOUNTAIN] / 6),
    Math.floor(remaining[TerrainType.DESCENT] / 4)
  );
  
  for (let i = 0; i < mountainDescents; i++) {
    // Mountain segment (6 cases)
    segments.push({ terrain: TerrainType.MOUNTAIN, length: 6 });
    remaining[TerrainType.MOUNTAIN] -= 6;
    
    // Descent segment (4 cases)
    segments.push({ terrain: TerrainType.DESCENT, length: 4 });
    remaining[TerrainType.DESCENT] -= 4;
  }
  
  // Add remaining mountain
  while (remaining[TerrainType.MOUNTAIN] >= 3) {
    segments.push({ terrain: TerrainType.MOUNTAIN, length: 3 });
    remaining[TerrainType.MOUNTAIN] -= 3;
  }
  
  // Add hills in groups of 3-4
  while (remaining[TerrainType.HILL] >= 3) {
    const len = Math.min(remaining[TerrainType.HILL], 4);
    segments.push({ terrain: TerrainType.HILL, length: len });
    remaining[TerrainType.HILL] -= len;
  }
  
  // Add remaining descent
  while (remaining[TerrainType.DESCENT] >= 2) {
    const len = Math.min(remaining[TerrainType.DESCENT], 3);
    segments.push({ terrain: TerrainType.DESCENT, length: len });
    remaining[TerrainType.DESCENT] -= len;
  }
  
  // Fill rest with flat
  const flatNeeded = middleLength - segments.reduce((sum, s) => sum + s.length, 0);
  if (flatNeeded > 0) {
    // Distribute flat in segments of 4-6
    let flatRemaining = flatNeeded;
    while (flatRemaining > 0) {
      const len = Math.min(flatRemaining, 5);
      segments.push({ terrain: TerrainType.FLAT, length: len });
      flatRemaining -= len;
    }
  }
  
  // Shuffle segments (but keep general flow)
  shuffleArray(segments);
  
  // Place segments into structure
  let pos = 5; // Start after initial flat
  for (const segment of segments) {
    for (let i = 0; i < segment.length && pos < sprintStart; i++) {
      structure[pos++] = segment.terrain;
    }
  }
  
  // Fill any remaining with flat
  while (pos < sprintStart) {
    structure[pos++] = TerrainType.FLAT;
  }
  
  return structure;
}

/**
 * Shuffle array in place (Fisher-Yates)
 * @param {Array} array
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Get terrain description for tooltip
 * @param {string} terrain - Terrain type
 * @returns {string} Description
 */
export function getTerrainDescription(terrain) {
  const descriptions = {
    [TerrainType.FLAT]: 'Plaine: Rouleur +1. Aspiration active, prise de vent possible.',
    [TerrainType.HILL]: 'Côte: Grimpeur +1, Puncheur +1, Sprinteur -1. Aspiration active.',
    [TerrainType.MOUNTAIN]: 'Montagne: Grimpeur +2, Puncheur +1, Rouleur -1, Sprinteur -2. Pas d\'aspiration ni prise de vent.',
    [TerrainType.DESCENT]: 'Descente: Tous +2/+3, minimum 4 cases. Risque de chute sur 1. Pas d\'aspiration.',
    [TerrainType.SPRINT]: 'Sprint: Sprinteur +2, Grimpeur -1. Aspiration active.'
  };
  return descriptions[terrain] || '';
}
