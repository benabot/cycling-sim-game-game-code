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
    hasWindPenalty: true
  },
  [TerrainType.DESCENT]: {
    name: 'Descente',
    emoji: '🟦',
    color: '#87CEEB',
    hasAspiration: false,
    hasWindPenalty: true
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
 * - Climber: summit bonus handled in game_engine
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
 * Mountain summit rules (v3.2+)
 * Summit stop removed; climbers get a light bonus on summit crossing.
 */
export const MountainRules = {
  climbersExempt: true,  // Climbers get summit bonus
  stopAtSummit: false    // No forced stop at summit
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
 * Used for summit crossing detection (bonus logic)
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

const COURSE_CONSTRAINTS = {
  mountainMin: 15,
  hillMin: 6,
  refuelMin: 5,
  refuelMax: 6
};

const MOUNTAIN_ALLOWED_PRESETS = new Set(['mountain', 'lombarde']);
const PAVES_PRESETS = new Set(['nord']);

function getTerrainMinLength(terrain) {
  if (terrain === TerrainType.MOUNTAIN) return COURSE_CONSTRAINTS.mountainMin;
  if (terrain === TerrainType.HILL) return COURSE_CONSTRAINTS.hillMin;
  return 1;
}

function getRefuelZoneLength(rng = Math.random) {
  const span = COURSE_CONSTRAINTS.refuelMax - COURSE_CONSTRAINTS.refuelMin;
  return COURSE_CONSTRAINTS.refuelMin + (span > 0 ? Math.floor(rng() * (span + 1)) : 0);
}

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
  const refuelZoneLength = getRefuelZoneLength();
  
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
function shuffleArray(array, rng = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
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
export function generateCourseFromPreset(preset, length = null, options = {}) {
  const courseLength = length || preset.defaultLength || 80;
  const distribution = preset.distribution;
  const structure = preset.structure ? { ...preset.structure } : {};
  const presetType = preset.presetType || preset.id || null;
  const rng = options.rng || Math.random;
  
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
  
  const baseEndSprint = structure.endSprint ?? 8;
  let allowSprintFinish = baseEndSprint > 0;
  if (structure.sprintFinishChance !== undefined && structure.sprintFinishChance !== null) {
    allowSprintFinish = rng() < structure.sprintFinishChance;
  }

  const adjustedStructure = {
    ...structure,
    endSprint: allowSprintFinish ? baseEndSprint : 0
  };

  // Build course structure based on preset rules
  const courseStructure = createCourseFromPresetStructure(
    courseLength,
    caseCounts,
    adjustedStructure,
    { rng, presetType }
  );
  
  // v5.0: Place refuel zones (~30% and ~65% of course)
  const refuelZone1Start = Math.floor(courseLength * 0.30);
  const refuelZone2Start = Math.floor(courseLength * 0.65);
  const refuelZoneLength = getRefuelZoneLength(rng);
  
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
  
  const validation = validateCourse(course, presetType, { allowSprintFinish });
  if (!validation.valid && typeof console !== 'undefined') {
    console.warn(`[race] preset "${presetType || 'unknown'}" violates V1 constraints:`, validation.issues);
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
function createCourseFromPresetStructure(length, caseCounts, structure, options = {}) {
  const rng = options.rng || Math.random;
  const presetType = options.presetType || null;
  const courseArray = new Array(length);
  const segmentPattern = structure.segmentPattern || null;

  let startFlat = structure.startFlat ?? 5;
  let endSprint = structure.endSprint ?? 8;

  startFlat = Math.max(0, Math.min(startFlat, length));
  endSprint = Math.max(0, Math.min(endSprint, length - startFlat));

  let middleLength = length - startFlat - endSprint;

  if (segmentPattern && segmentPattern.length > 0) {
    const minTotal = segmentPattern.reduce((sum, segment) => {
      const minLength = Math.max(segment.min ?? 1, getTerrainMinLength(segment.terrain));
      return sum + minLength;
    }, 0);

    if (middleLength < minTotal) {
      let shortage = minTotal - middleLength;
      const startCut = Math.min(startFlat, shortage);
      startFlat -= startCut;
      shortage -= startCut;
      const endCut = Math.min(endSprint, shortage);
      endSprint -= endCut;
      middleLength = length - startFlat - endSprint;
    }
  }

  // 1. Place start flat zone
  for (let i = 0; i < startFlat; i++) {
    courseArray[i] = TerrainType.FLAT;
  }

  // 2. Place end sprint zone (if any)
  const sprintStart = length - endSprint;
  if (endSprint > 0) {
    for (let i = sprintStart; i < length; i++) {
      courseArray[i] = TerrainType.SPRINT;
    }
  }

  const middleStart = startFlat;
  const middleEnd = sprintStart;

  let segments = [];

  if (segmentPattern && segmentPattern.length > 0) {
    segments = buildSegmentsFromPattern(segmentPattern, middleLength, rng);
    segments = normalizeSegments(segments, presetType);
  } else {
    const remaining = { ...caseCounts };
    const mountainMinLength = Math.max(structure.mountainMinLength || COURSE_CONSTRAINTS.mountainMin, COURSE_CONSTRAINTS.mountainMin);
    const hillMaxLength = Math.max(structure.hillMaxLength || COURSE_CONSTRAINTS.hillMin, COURSE_CONSTRAINTS.hillMin);

    // Adjust remaining counts based on start flat / end sprint
    remaining[TerrainType.FLAT] = Math.max(0, (remaining[TerrainType.FLAT] || 0) - startFlat);
    remaining[TerrainType.SPRINT] = Math.max(0, (remaining[TerrainType.SPRINT] || 0) - endSprint);

    // Build segments for middle section (legacy behavior)
    if (remaining[TerrainType.MOUNTAIN] > 0) {
      const mountainLen = Math.min(remaining[TerrainType.MOUNTAIN], Math.max(mountainMinLength, remaining[TerrainType.MOUNTAIN]));
      segments.push({ terrain: TerrainType.MOUNTAIN, length: mountainLen });
      remaining[TerrainType.MOUNTAIN] -= mountainLen;

      if (remaining[TerrainType.DESCENT] > 0) {
        const descentLen = Math.min(remaining[TerrainType.DESCENT], Math.floor(mountainLen * 0.7));
        if (descentLen >= 3) {
          segments.push({ terrain: TerrainType.DESCENT, length: descentLen });
          remaining[TerrainType.DESCENT] -= descentLen;
        }
      }
    }

    while (remaining[TerrainType.HILL] >= 2) {
      const hillLen = Math.min(remaining[TerrainType.HILL], hillMaxLength, 2 + Math.floor(rng() * 3));
      segments.push({ terrain: TerrainType.HILL, length: hillLen });
      remaining[TerrainType.HILL] -= hillLen;

      if (remaining[TerrainType.DESCENT] >= 2 && rng() > 0.5) {
        const descentLen = Math.min(remaining[TerrainType.DESCENT], 3);
        segments.push({ terrain: TerrainType.DESCENT, length: descentLen });
        remaining[TerrainType.DESCENT] -= descentLen;
      }
    }

    if (remaining[TerrainType.DESCENT] > 0) {
      segments.push({ terrain: TerrainType.DESCENT, length: remaining[TerrainType.DESCENT] });
      remaining[TerrainType.DESCENT] = 0;
    }

    if (remaining[TerrainType.SPRINT] > 0) {
      segments.push({ terrain: TerrainType.SPRINT, length: remaining[TerrainType.SPRINT] });
      remaining[TerrainType.SPRINT] = 0;
    }

    const usedBySegments = segments.reduce((sum, s) => sum + s.length, 0);
    const flatNeeded = middleLength - usedBySegments;

    if (flatNeeded > 0) {
      let flatRemaining = flatNeeded;
      while (flatRemaining > 0) {
        const flatLen = Math.min(flatRemaining, 4 + Math.floor(rng() * 4)); // 4-7 cases
        segments.push({ terrain: TerrainType.FLAT, length: flatLen });
        flatRemaining -= flatLen;
      }
    }

    segments = normalizeSegments(segments, presetType);
  }

  // 3. Place segments into course array
  let pos = middleStart;
  for (const segment of segments) {
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

function buildSegmentsFromPattern(pattern, totalLength, rng) {
  let constraints = pattern.map(segment => {
    const minLength = Math.max(segment.min ?? 1, getTerrainMinLength(segment.terrain));
    const maxLength = Math.max(segment.max ?? minLength, minLength);
    return { terrain: segment.terrain, min: minLength, max: maxLength };
  });

  let minTotal = constraints.reduce((sum, segment) => sum + segment.min, 0);
  if (minTotal > totalLength) {
    const scale = totalLength / minTotal;
    constraints = constraints.map(segment => {
      const scaledMin = Math.max(1, Math.floor(segment.min * scale));
      const scaledMax = Math.max(scaledMin, Math.floor(segment.max * scale));
      return { ...segment, min: scaledMin, max: Math.max(segment.max, scaledMax) };
    });
    minTotal = constraints.reduce((sum, segment) => sum + segment.min, 0);
  }

  const segments = [];
  let remaining = totalLength;

  for (let i = 0; i < constraints.length; i++) {
    const segment = constraints[i];
    const remainingMin = constraints
      .slice(i + 1)
      .reduce((sum, nextSegment) => sum + nextSegment.min, 0);
    let maxAllowed = Math.min(segment.max, remaining - remainingMin);

    if (maxAllowed < segment.min) {
      maxAllowed = Math.max(1, remaining - remainingMin);
    }

    const minAllowed = Math.min(segment.min, maxAllowed);
    let length = minAllowed;
    if (maxAllowed > minAllowed) {
      length = minAllowed + Math.floor(rng() * (maxAllowed - minAllowed + 1));
    }

    segments.push({ terrain: segment.terrain, length, max: segment.max });
    remaining -= length;
  }

  if (remaining > 0 && segments.length > 0) {
    for (const segment of segments) {
      const maxLength = segment.max ?? segment.length;
      const room = Math.max(0, maxLength - segment.length);
      if (room <= 0) continue;
      const add = Math.min(room, remaining);
      segment.length += add;
      remaining -= add;
      if (remaining <= 0) break;
    }
    if (remaining > 0) {
      segments[segments.length - 1].length += remaining;
    }
  }

  return segments.map(({ terrain, length }) => ({ terrain, length }));
}

function normalizeSegments(segments, presetType) {
  const mountainAllowed = presetType ? MOUNTAIN_ALLOWED_PRESETS.has(presetType) : true;
  const adjusted = segments.map(segment => {
    let terrain = segment.terrain;

    if (terrain === TerrainType.MOUNTAIN) {
      if (!mountainAllowed || segment.length < COURSE_CONSTRAINTS.mountainMin) {
        terrain = TerrainType.HILL;
      }
    }

    if (terrain === TerrainType.HILL && segment.length < COURSE_CONSTRAINTS.hillMin) {
      terrain = TerrainType.FLAT;
    }

    return { terrain, length: segment.length };
  });

  return mergeSegments(adjusted);
}

function mergeSegments(segments) {
  const merged = [];
  for (const segment of segments) {
    if (!segment || segment.length <= 0) continue;
    const last = merged[merged.length - 1];
    if (last && last.terrain === segment.terrain) {
      last.length += segment.length;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

function extractTerrainSegments(course) {
  const segments = [];
  for (const cell of course) {
    if (!segments.length || segments[segments.length - 1].terrain !== cell.terrain) {
      segments.push({ terrain: cell.terrain, length: 1 });
    } else {
      segments[segments.length - 1].length += 1;
    }
  }
  return segments;
}

function extractRefuelSegments(course) {
  const segments = [];
  for (const cell of course) {
    const isRefuel = !!cell.isRefuelZone;
    if (!segments.length || segments[segments.length - 1].isRefuel !== isRefuel) {
      segments.push({ isRefuel, length: 1 });
    } else {
      segments[segments.length - 1].length += 1;
    }
  }
  return segments.filter(segment => segment.isRefuel);
}

export function validateCourse(course, presetType, options = {}) {
  const issues = [];
  if (!course || course.length === 0) {
    return { valid: false, issues: ['course: empty'] };
  }

  const segments = extractTerrainSegments(course);
  const mountainSegments = segments.filter(segment => segment.terrain === TerrainType.MOUNTAIN);
  const hillSegments = segments.filter(segment => segment.terrain === TerrainType.HILL);
  const mountainAllowed = presetType ? MOUNTAIN_ALLOWED_PRESETS.has(presetType) : true;

  if (!mountainAllowed && mountainSegments.length > 0) {
    issues.push('mountain: forbidden in this preset');
  }

  for (const segment of mountainSegments) {
    if (segment.length < COURSE_CONSTRAINTS.mountainMin) {
      issues.push(`mountain: segment < ${COURSE_CONSTRAINTS.mountainMin}`);
      break;
    }
  }

  for (const segment of hillSegments) {
    if (segment.length < COURSE_CONSTRAINTS.hillMin) {
      issues.push(`hill: segment < ${COURSE_CONSTRAINTS.hillMin}`);
      break;
    }
  }

  const refuelSegments = extractRefuelSegments(course);
  for (const segment of refuelSegments) {
    if (segment.length < COURSE_CONSTRAINTS.refuelMin || segment.length > COURSE_CONSTRAINTS.refuelMax) {
      issues.push(`refuel: segment length ${segment.length}`);
      break;
    }
  }

  if (presetType && PAVES_PRESETS.has(presetType)) {
    const lastTerrain = course[course.length - 1]?.terrain;
    if (lastTerrain !== TerrainType.SPRINT) {
      issues.push('paves: sprint finish required');
    }

    const hillFlatSequence = segments
      .filter(segment => segment.terrain === TerrainType.HILL || segment.terrain === TerrainType.FLAT)
      .map(segment => segment.terrain);

    for (let i = 1; i < hillFlatSequence.length; i++) {
      if (hillFlatSequence[i] === hillFlatSequence[i - 1]) {
        issues.push('paves: hills/flats should alternate');
        break;
      }
    }

    if (!hillFlatSequence.includes(TerrainType.HILL)) {
      issues.push('paves: missing hill segments');
    }
    if (!hillFlatSequence.includes(TerrainType.FLAT)) {
      issues.push('paves: missing flat segments');
    }
  }

  if (presetType && MOUNTAIN_ALLOWED_PRESETS.has(presetType)) {
    if (mountainSegments.length < 2) {
      issues.push('mountain: requires at least 2 mountain segments');
    }
    if (!segments.some(segment => segment.terrain === TerrainType.DESCENT)) {
      issues.push('mountain: missing descent segment');
    }
    if (!segments.some(segment => segment.terrain === TerrainType.FLAT)) {
      issues.push('mountain: missing flat segment');
    }

    const allowSprintFinish = options.allowSprintFinish;
    const endsWithSprint = course[course.length - 1]?.terrain === TerrainType.SPRINT;
    if (allowSprintFinish === false && endsWithSprint) {
      issues.push('mountain: sprint finish not allowed');
    }
  }

  return { valid: issues.length === 0, issues };
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
