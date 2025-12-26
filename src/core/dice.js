/**
 * Dice rolling utilities - v3 (1d6 system)
 * @module core/dice
 */

/**
 * Roll a single d6
 * @returns {Object} Roll result
 */
export function roll1D6() {
  const result = Math.floor(Math.random() * 6) + 1;
  
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
export function roll2D6() {
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
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
export function rollFallTest() {
  const roll = Math.floor(Math.random() * 6) + 1;
  
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
