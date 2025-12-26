/**
 * Dice utilities for cycling race game
 * @module core/dice
 */

/**
 * Roll a single d6
 * @returns {number} Result between 1 and 6
 */
export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll 2d6
 * @returns {{dice1: number, dice2: number, total: number, isSnakeEyes: boolean, isSeven: boolean}}
 */
export function roll2D6() {
  const dice1 = rollD6();
  const dice2 = rollD6();
  const total = dice1 + dice2;
  
  return {
    dice1,
    dice2,
    total,
    isSnakeEyes: dice1 === 1 && dice2 === 1,
    isSeven: total === 7
  };
}

/**
 * Roll for fall test in descent (1d6)
 * @returns {{roll: number, hasFallen: boolean}}
 */
export function rollFallTest() {
  const roll = rollD6();
  return {
    roll,
    hasFallen: roll <= 2  // Fall on 1-2
  };
}
