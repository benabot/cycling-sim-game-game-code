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
    color: '#d4a574',
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
 * Terrain bonus matrix by rider type (v3.2 - rebalanced)
 * Positive = bonus, Negative = malus
 * 
 * v3.2 Balance changes:
 * - Rouleur: +2 flat (was +1), wind immunity (handled in game_engine)
 * - Sprinter: +3 sprint (was +2)
 * - Puncher: +2 hill (was +1), no penalty on short mountain (≤3 cases, handled in game_engine)
 * - Climber: no forced stop at summit (handled in game_engine)
 */
export const TerrainBonus = {
  [TerrainType.FLAT]: {
    climber: 0,
    puncher: 0,
    rouleur: 2,    // v3.2: +2 (was +1)
    sprinter: 0,
    versatile: 0
  },
  [TerrainType.HILL]: {
    climber: 1,
    puncher: 2,    // v3.2: +2 (was +1)
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
    sprinter: 3,   // v3.2: +3 (was +2)
    versatile: 0
  }
};

/**
 * Mountain summit stop rules (v3.2)
 * Non-climbers must stop at the last mountain cell if their movement
 * would take them beyond the mountain section
 */
export const MountainRules = {
  climbersExempt: true,  // Climbers can pass through summits freely
  stopAtSummit: true     // Non-climbers must stop at summit
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
 * Find the last mountain cell before leaving mountain terrain (summit)
 * Used for summit stop rule for non-climbers
 * 
 * IMPORTANT: Positions are 1-based (position 1 = course[0])
 * 
 * @param {Array} course - Course array (0-indexed)
 * @param {number} startPosition - Starting position (1-based)
 * @param {number} targetPosition - Target position after movement (1-based)
 * @returns {number|null} Summit position (1-based) or null if no summit crossing
 */
export function findSummitPosition(course, startPosition, targetPosition) {
  // Convert 1-based position to 0-based index
  const startIndex = startPosition - 1;
  
  // Bounds check
  if (startIndex < 0 || startIndex >= course.length) {
    return null;
  }
  
  // Check if we're in mountain terrain at start
  const startTerrain = course[startIndex]?.terrain;
  if (startTerrain !== TerrainType.MOUNTAIN) {
    return null; // Not starting in mountain
  }
  
  // Find the summit (last mountain cell before non-mountain)
  // Work with 1-based positions for the result
  let summitPos = null;
  for (let pos = startPosition; pos <= course.length; pos++) {
    const idx = pos - 1; // Convert to 0-based index
    if (idx >= course.length) break;
    
    const terrain = course[idx]?.terrain;
    if (terrain === TerrainType.MOUNTAIN) {
      summitPos = pos; // Store 1-based position
    } else {
      break; // Found end of mountain section
    }
  }
  
  // If already at summit, don't block again - let them pass
  if (startPosition === summitPos) {
    return null;
  }
  
  // Check if movement would cross the summit
  if (summitPos !== null && targetPosition > summitPos) {
    return summitPos;
  }
  
  return null;
}

/**
 * Check if a rider type is exempt from summit stop rule
 * @param {string} riderType - Rider type
 * @returns {boolean} True if exempt (climbers)
 */
export function isExemptFromSummitStop(riderType) {
  return riderType === 'climber';
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
  
  // v4.0: Place 2 refuel zones of 3 cells each (~30% and ~65% of course)
  const refuelZone1Start = Math.floor(length * 0.30);
  const refuelZone2Start = Math.floor(length * 0.65);
  const refuelZoneLength = 3;
  
  for (let i = 0; i < length; i++) {
    const isInRefuelZone1 = i >= refuelZone1Start && i < refuelZone1Start + refuelZoneLength;
    const isInRefuelZone2 = i >= refuelZone2Start && i < refuelZone2Start + refuelZoneLength;
    
    course.push({
      index: i,
      terrain: courseStructure[i],
      config: TerrainConfig[courseStructure[i]],
      isRefuelZone: isInRefuelZone1 || isInRefuelZone2
    });
  }
  
  return course;
}

/**
 * Check if a position is a refuel zone
 * IMPORTANT: Position is 1-based (position 1 = course[0])
 * @param {Array} course - Course array (0-indexed)
 * @param {number} position - Position to check (1-based)
 * @returns {boolean} True if refuel zone
 */
export function isRefuelZone(course, position) {
  // Convert 1-based position to 0-based index
  const index = position - 1;
  if (index < 0 || index >= course.length) return false;
  return course[index]?.isRefuelZone || false;
}

/**
 * Create a logical course structure (realistic race progression)
 * v3.2.2: Mountain minimum 15 consecutive cases, Hill maximum 15 total
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
  
  // v3.2.2: Enforce terrain constraints
  // - Mountain: minimum 15 consecutive cases (one big climb)
  // - Hill: maximum 15 cases total (short punchy climbs)
  const mountainCases = Math.max(15, dist[TerrainType.MOUNTAIN]);
  const hillCases = Math.min(15, dist[TerrainType.HILL]);
  
  // Remaining terrain to distribute
  const remaining = {
    [TerrainType.FLAT]: dist[TerrainType.FLAT] - 5,
    [TerrainType.HILL]: hillCases,
    [TerrainType.MOUNTAIN]: mountainCases,
    [TerrainType.DESCENT]: dist[TerrainType.DESCENT],
    [TerrainType.SPRINT]: 0 // Already placed
  };
  
  // Create segments for middle section
  const middleLength = sprintStart - 5;
  const segments = [];
  
  // v3.2.2: Create ONE big mountain segment (minimum 15 cases) followed by descent
  if (remaining[TerrainType.MOUNTAIN] >= 15) {
    // Single mountain block (realistic col)
    segments.push({ terrain: TerrainType.MOUNTAIN, length: remaining[TerrainType.MOUNTAIN] });
    
    // Descent after mountain (all descent cases)
    if (remaining[TerrainType.DESCENT] > 0) {
      segments.push({ terrain: TerrainType.DESCENT, length: remaining[TerrainType.DESCENT] });
      remaining[TerrainType.DESCENT] = 0;
    }
    
    remaining[TerrainType.MOUNTAIN] = 0;
  }
  
  // v3.2.2: Add hills in small groups (3-5 cases each, total max 15)
  // Hills are punchy short climbs, not long ascents
  let hillRemaining = remaining[TerrainType.HILL];
  while (hillRemaining >= 3) {
    const len = Math.min(hillRemaining, 3 + Math.floor(Math.random() * 3)); // 3-5 cases
    segments.push({ terrain: TerrainType.HILL, length: len });
    hillRemaining -= len;
  }
  remaining[TerrainType.HILL] = 0;
  
  // Add any remaining descent (if not all used after mountain)
  while (remaining[TerrainType.DESCENT] >= 2) {
    const len = Math.min(remaining[TerrainType.DESCENT], 4);
    segments.push({ terrain: TerrainType.DESCENT, length: len });
    remaining[TerrainType.DESCENT] -= len;
  }
  
  // Fill rest with flat
  const usedLength = segments.reduce((sum, s) => sum + s.length, 0);
  const flatNeeded = middleLength - usedLength;
  if (flatNeeded > 0) {
    // Distribute flat in segments of 4-6
    let flatRemaining = flatNeeded;
    while (flatRemaining > 0) {
      const len = Math.min(flatRemaining, 4 + Math.floor(Math.random() * 3)); // 4-6 cases
      segments.push({ terrain: TerrainType.FLAT, length: len });
      flatRemaining -= len;
    }
  }
  
  // Shuffle segments but keep mountain+descent together at a strategic position
  // Find mountain and descent segments
  const mountainIdx = segments.findIndex(s => s.terrain === TerrainType.MOUNTAIN);
  const descentIdx = segments.findIndex(s => s.terrain === TerrainType.DESCENT && s.length > 5);
  
  // Remove mountain+descent pair if they exist
  let mountainSegment = null;
  let descentSegment = null;
  
  if (mountainIdx !== -1) {
    mountainSegment = segments.splice(mountainIdx, 1)[0];
  }
  
  const newDescentIdx = segments.findIndex(s => s.terrain === TerrainType.DESCENT && s.length > 5);
  if (newDescentIdx !== -1) {
    descentSegment = segments.splice(newDescentIdx, 1)[0];
  }
  
  // Shuffle other segments
  shuffleArray(segments);
  
  // Insert mountain at ~40-60% of the course (realistic race progression)
  if (mountainSegment) {
    const insertPos = Math.floor(segments.length * 0.4) + Math.floor(Math.random() * (segments.length * 0.2));
    segments.splice(insertPos, 0, mountainSegment);
    
    // Insert descent right after mountain
    if (descentSegment) {
      segments.splice(insertPos + 1, 0, descentSegment);
    }
  }
  
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
    [TerrainType.FLAT]: 'Plaine: Rouleur +2, immunité vent. Aspiration active, leader exposé → Relais.',
    [TerrainType.HILL]: 'Côte: Puncheur +2, Grimpeur +1, Sprinteur -1. Aspiration active.',
    [TerrainType.MOUNTAIN]: 'Montagne: Grimpeur +2, Puncheur +1, Rouleur -1, Sprinteur -2. Tous reçoivent Tempo.',
    [TerrainType.DESCENT]: 'Descente: Tous +2/+3, minimum 4 cases. Risque de chute sur 1. Pas d\'aspiration.',
    [TerrainType.SPRINT]: 'Sprint: Sprinteur +3, Grimpeur -1. Aspiration active.'
  };
  return descriptions[terrain] || '';
}

/**
 * Generate a course from a preset configuration (v5.0)
 * Used for predefined classics and stage races
 * 
 * @param {Object} preset - Preset configuration with distribution and structure
 * @param {number} length - Course length (overrides preset default if provided)
 * @returns {Array} Course array with terrain info
 */
export function generateCourseFromPreset(preset, length = null) {
  const courseLength = length || preset.defaultLength || 80;
  const distribution = preset.distribution;
  const structure = preset.structure || {};
  
  const course = [];
  
  // Calculate actual case counts from percentages
  const caseCounts = {};
  let total = 0;
  
  for (const [terrain, percentage] of Object.entries(distribution)) {
    const count = Math.round((percentage / 100) * courseLength);
    caseCounts[terrain] = count;
    total += count;
  }
  
  // Adjust for rounding errors
  if (total !== courseLength) {
    caseCounts[TerrainType.FLAT] += (courseLength - total);
  }
  
  // Build course structure based on preset rules
  const courseStructure = createCourseFromPresetStructure(courseLength, caseCounts, structure);
  
  // v5.0: Place refuel zones (~30% and ~65% of course)
  const refuelZone1Start = Math.floor(courseLength * 0.30);
  const refuelZone2Start = Math.floor(courseLength * 0.65);
  const refuelZoneLength = 3;
  
  for (let i = 0; i < courseLength; i++) {
    const isInRefuelZone1 = i >= refuelZone1Start && i < refuelZone1Start + refuelZoneLength;
    const isInRefuelZone2 = i >= refuelZone2Start && i < refuelZone2Start + refuelZoneLength;
    
    course.push({
      index: i,
      terrain: courseStructure[i],
      config: TerrainConfig[courseStructure[i]],
      isRefuelZone: isInRefuelZone1 || isInRefuelZone2
    });
  }
  
  return course;
}

/**
 * Create course structure from preset configuration
 * More controlled than random generation - follows preset structure rules
 * 
 * @param {number} length - Course length
 * @param {Object} caseCounts - Number of cases per terrain type
 * @param {Object} structure - Structure rules (startFlat, endSprint, mountainMinLength, hillMaxLength)
 * @returns {Array} Array of terrain types
 */
function createCourseFromPresetStructure(length, caseCounts, structure) {
  const courseArray = new Array(length);
  const remaining = { ...caseCounts };
  
  // Extract structure parameters with defaults
  const startFlat = structure.startFlat || 5;
  const endSprint = structure.endSprint || 8;
  const mountainMinLength = structure.mountainMinLength || 15;
  const hillMaxLength = structure.hillMaxLength || 5;
  
  // 1. Place start flat zone
  const actualStartFlat = Math.min(startFlat, remaining[TerrainType.FLAT] || 0);
  for (let i = 0; i < actualStartFlat; i++) {
    courseArray[i] = TerrainType.FLAT;
  }
  remaining[TerrainType.FLAT] = Math.max(0, (remaining[TerrainType.FLAT] || 0) - actualStartFlat);
  
  // 2. Place end sprint zone
  const sprintStart = length - endSprint;
  const actualEndSprint = Math.min(endSprint, remaining[TerrainType.SPRINT] || 0);
  for (let i = 0; i < actualEndSprint; i++) {
    courseArray[sprintStart + i] = TerrainType.SPRINT;
  }
  remaining[TerrainType.SPRINT] = Math.max(0, (remaining[TerrainType.SPRINT] || 0) - actualEndSprint);
  
  // Fill remaining sprint zone with flat if needed
  for (let i = sprintStart + actualEndSprint; i < length; i++) {
    if (!courseArray[i]) {
      courseArray[i] = TerrainType.FLAT;
      remaining[TerrainType.FLAT] = Math.max(0, (remaining[TerrainType.FLAT] || 0) - 1);
    }
  }
  
  // 3. Build segments for middle section
  const segments = [];
  const middleStart = actualStartFlat;
  const middleEnd = sprintStart;
  const middleLength = middleEnd - middleStart;
  
  // 3a. Create mountain segment (one big climb) if we have mountain cases
  if (remaining[TerrainType.MOUNTAIN] > 0) {
    const mountainLen = Math.min(remaining[TerrainType.MOUNTAIN], Math.max(mountainMinLength, remaining[TerrainType.MOUNTAIN]));
    segments.push({ terrain: TerrainType.MOUNTAIN, length: mountainLen });
    remaining[TerrainType.MOUNTAIN] -= mountainLen;
    
    // Add descent right after mountain
    if (remaining[TerrainType.DESCENT] > 0) {
      const descentLen = Math.min(remaining[TerrainType.DESCENT], Math.floor(mountainLen * 0.7));
      if (descentLen >= 3) {
        segments.push({ terrain: TerrainType.DESCENT, length: descentLen });
        remaining[TerrainType.DESCENT] -= descentLen;
      }
    }
  }
  
  // 3b. Create hill segments (short punchy climbs)
  while (remaining[TerrainType.HILL] >= 2) {
    const hillLen = Math.min(remaining[TerrainType.HILL], hillMaxLength, 2 + Math.floor(Math.random() * 3));
    segments.push({ terrain: TerrainType.HILL, length: hillLen });
    remaining[TerrainType.HILL] -= hillLen;
    
    // Small descent after some hills
    if (remaining[TerrainType.DESCENT] >= 2 && Math.random() > 0.5) {
      const descentLen = Math.min(remaining[TerrainType.DESCENT], 3);
      segments.push({ terrain: TerrainType.DESCENT, length: descentLen });
      remaining[TerrainType.DESCENT] -= descentLen;
    }
  }
  
  // 3c. Add remaining descent
  if (remaining[TerrainType.DESCENT] > 0) {
    segments.push({ terrain: TerrainType.DESCENT, length: remaining[TerrainType.DESCENT] });
    remaining[TerrainType.DESCENT] = 0;
  }
  
  // 3d. Add remaining sprint zones (if any before final)
  if (remaining[TerrainType.SPRINT] > 0) {
    segments.push({ terrain: TerrainType.SPRINT, length: remaining[TerrainType.SPRINT] });
    remaining[TerrainType.SPRINT] = 0;
  }
  
  // 3e. Fill with flat segments
  const usedBySegments = segments.reduce((sum, s) => sum + s.length, 0);
  const flatNeeded = middleLength - usedBySegments;
  
  if (flatNeeded > 0) {
    // Create multiple flat segments for variety
    let flatRemaining = flatNeeded;
    while (flatRemaining > 0) {
      const flatLen = Math.min(flatRemaining, 4 + Math.floor(Math.random() * 4)); // 4-7 cases
      segments.push({ terrain: TerrainType.FLAT, length: flatLen });
      flatRemaining -= flatLen;
    }
  }
  
  // 4. Organize segments strategically
  // Keep mountain+descent pair, shuffle the rest
  const mountainDescentPair = [];
  const otherSegments = [];
  
  let i = 0;
  while (i < segments.length) {
    if (segments[i].terrain === TerrainType.MOUNTAIN) {
      mountainDescentPair.push(segments[i]);
      // Check if next segment is descent
      if (i + 1 < segments.length && segments[i + 1].terrain === TerrainType.DESCENT) {
        mountainDescentPair.push(segments[i + 1]);
        i += 2;
        continue;
      }
    } else {
      otherSegments.push(segments[i]);
    }
    i++;
  }
  
  // Shuffle other segments
  shuffleArray(otherSegments);
  
  // Insert mountain pair at ~40-60% of the middle section (if exists)
  const finalSegments = [...otherSegments];
  if (mountainDescentPair.length > 0) {
    const insertPos = Math.floor(finalSegments.length * 0.35) + Math.floor(Math.random() * (finalSegments.length * 0.25));
    finalSegments.splice(insertPos, 0, ...mountainDescentPair);
  }
  
  // 5. Place segments into course array
  let pos = middleStart;
  for (const segment of finalSegments) {
    for (let j = 0; j < segment.length && pos < middleEnd; j++) {
      courseArray[pos++] = segment.terrain;
    }
  }
  
  // Fill any remaining with flat
  while (pos < middleEnd) {
    courseArray[pos++] = TerrainType.FLAT;
  }
  
  return courseArray;
}

/**
 * Calculate terrain distribution percentages from a course
 * @param {Array} course - Course array
 * @returns {Object} Distribution percentages by terrain type
 */
export function calculateCourseDistribution(course) {
  const counts = {};
  const total = course.length;
  
  for (const cell of course) {
    const terrain = cell.terrain;
    counts[terrain] = (counts[terrain] || 0) + 1;
  }
  
  const distribution = {};
  for (const [terrain, count] of Object.entries(counts)) {
    distribution[terrain] = Math.round((count / total) * 100);
  }
  
  return distribution;
}
