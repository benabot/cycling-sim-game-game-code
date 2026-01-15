/**
 * Dice rolling utilities - v3 (1d6 system)
 * @module core/dice
 */

let activeRng = Math.random;

function normalizeSeed(seed) {
  if (seed === null || seed === undefined) return 0;
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed;
  const str = String(seed);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function createSeededRng(seed) {
  let t = normalizeSeed(seed) >>> 0;
  return function seededRng() {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function setRng(rng) {
  activeRng = typeof rng === 'function' ? rng : Math.random;
}

export function getRng() {
  return activeRng;
}

/**
 * Roll a single d6
 * @returns {Object} Roll result
 */
export function roll1D6(rng = activeRng) {
  const result = Math.floor(rng() * 6) + 1;
  
  return {
    result,
    isOne: result === 1,
    isSix: result === 6
  };
}

/**
 * Roll 2d6 (kept for compatibility and fall tests)
 * @returns {Object} Roll result with both dice and total
 */
export function roll2D6(rng = activeRng) {
  const dice1 = Math.floor(rng() * 6) + 1;
  const dice2 = Math.floor(rng() * 6) + 1;
  const total = dice1 + dice2;
  
  return {
    dice1,
    dice2,
    total,
    isDouble: dice1 === dice2,
    isSnakeEyes: dice1 === 1 && dice2 === 1,
    isBoxcars: dice1 === 6 && dice2 === 6,
    isSeven: total === 7
  };
}

/**
 * Roll fall test for descent (1d6)
 * @returns {Object} Fall test result
 */
export function rollFallTest(rng = activeRng) {
  const roll = Math.floor(rng() * 6) + 1;
  
  return {
    roll,
    hasFallen: roll <= 2 // Fall on 1-2
  };
}

/**
 * Get average value for 1d6
 * @returns {number} Average (3.5)
 */
export function getD6Average() {
  return 3.5;
}

/**
 * Get dice range for 1d6
 * @returns {Object} Min and max values
 */
export function getD6Range() {
  return {
    min: 1,
    max: 6
  };
}
