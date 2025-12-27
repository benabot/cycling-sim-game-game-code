/**
 * AI Module - v4.0 Basic AI for cycling game
 * @module core/ai
 */

import { RiderType, CardType } from './rider.js';
import { TerrainType, getTerrainBonus } from './terrain.js';
import { getEnergyEffects, getEnergyStatus } from './energy.js';
import { AIDifficulty } from './teams.js';

/**
 * AI decision result
 * @typedef {Object} AIDecision
 * @property {string} type - Decision type ('select_rider', 'select_card', 'use_specialty', 'skip_specialty')
 * @property {string} [riderId] - Selected rider ID
 * @property {string} [cardId] - Selected card ID
 * @property {boolean} [useSpecialty] - Whether to use specialty
 * @property {string} [reason] - Explanation for decision
 */

/**
 * Main AI class for making game decisions
 */
export class CyclingAI {
  constructor(difficulty = AIDifficulty.NORMAL) {
    this.difficulty = difficulty;
    this.thinkingDelay = this.getThinkingDelay();
  }

  /**
   * Get thinking delay based on difficulty
   */
  getThinkingDelay() {
    switch (this.difficulty) {
      case AIDifficulty.EASY: return 800;
      case AIDifficulty.NORMAL: return 600;
      case AIDifficulty.HARD: return 400;
      default: return 600;
    }
  }

  /**
   * Make a decision based on current game state and phase
   * @param {Object} state - Current game state
   * @param {string} phase - Current turn phase
   * @param {string} teamId - AI's team ID
   * @returns {AIDecision} The AI's decision
   */
  makeDecision(state, phase, teamId) {
    switch (phase) {
      case 'select_rider':
        return this.selectRider(state, teamId);
      case 'select_card':
        return this.selectCard(state, teamId);
      case 'roll_dice':
        return { type: 'roll_dice', reason: 'Lancer automatique' };
      case 'select_specialty':
        return this.decideSpecialty(state, teamId);
      case 'resolve':
        return { type: 'resolve', reason: 'Résolution automatique' };
      default:
        return { type: 'wait', reason: 'Phase non gérée' };
    }
  }

  /**
   * Select which rider to play
   */
  selectRider(state, teamId) {
    const availableRiders = state.riders.filter(r => 
      r.team === teamId && 
      !state.ridersPlayedThisTurn.includes(r.id) &&
      !r.hasFinished &&
      !r.skipNextTurn
    );

    if (availableRiders.length === 0) {
      return { type: 'no_rider', reason: 'Aucun coureur disponible' };
    }

    // Strategy: prioritize based on position and terrain
    const scoredRiders = availableRiders.map(rider => ({
      rider,
      score: this.scoreRiderSelection(rider, state)
    }));

    // Sort by score descending
    scoredRiders.sort((a, b) => b.score - a.score);

    // Add some randomness for easy difficulty
    let selectedRider;
    if (this.difficulty === AIDifficulty.EASY && Math.random() < 0.3) {
      // 30% chance to pick randomly
      selectedRider = availableRiders[Math.floor(Math.random() * availableRiders.length)];
    } else {
      selectedRider = scoredRiders[0].rider;
    }

    return {
      type: 'select_rider',
      riderId: selectedRider.id,
      reason: `Sélection de ${selectedRider.name}`
    };
  }

  /**
   * Score a rider for selection priority
   */
  scoreRiderSelection(rider, state) {
    let score = 50;
    const terrain = this.getTerrainAtPosition(state, rider.position);
    const terrainBonus = getTerrainBonus(rider.type, terrain);

    // Bonus for favorable terrain
    score += terrainBonus * 10;

    // Bonus for riders in good position (closer to finish)
    score += rider.position * 0.5;

    // Bonus for healthy energy
    const energyStatus = getEnergyStatus(rider.energy);
    if (energyStatus === 'normal') score += 10;
    if (energyStatus === 'tired') score -= 5;
    if (energyStatus === 'exhausted') score -= 15;
    if (energyStatus === 'fringale') score -= 30;

    // Bonus if has specialty cards and on right terrain
    if (rider.specialtyCards?.length > 0) {
      const specialtyTerrain = this.getSpecialtyTerrain(rider.type);
      if (terrain === specialtyTerrain) {
        score += 15;
      }
    }

    // Hard AI: consider attack cards for strategic moments
    if (this.difficulty === AIDifficulty.HARD) {
      const distanceToFinish = state.courseLength - rider.position;
      if (distanceToFinish < 20 && rider.attackCards?.length > 0) {
        score += 20;
      }
    }

    return score;
  }

  /**
   * Select which card to play
   */
  selectCard(state, teamId) {
    const rider = state.riders.find(r => r.id === state.selectedRiderId);
    if (!rider) {
      return { type: 'error', reason: 'Coureur non trouvé' };
    }

    const terrain = this.getTerrainAtPosition(state, rider.position);
    const energyEffects = getEnergyEffects(rider.energy);
    const distanceToFinish = state.courseLength - rider.position;

    // Get available cards
    const movementCards = rider.hand || [];
    const attackCards = energyEffects.canUseAttackCard ? (rider.attackCards || []) : [];

    // Decision: use attack card?
    if (attackCards.length > 0 && this.shouldUseAttack(rider, state, distanceToFinish)) {
      const attackCard = attackCards[0];
      return {
        type: 'select_card',
        cardId: attackCard.id,
        isAttack: true,
        reason: `Attaque ! (${distanceToFinish} cases de l'arrivée)`
      };
    }

    // Select best movement card
    if (movementCards.length === 0) {
      return { type: 'error', reason: 'Aucune carte disponible' };
    }

    const selectedCard = this.selectBestMovementCard(movementCards, rider, state, terrain);
    return {
      type: 'select_card',
      cardId: selectedCard.id,
      reason: `Carte +${selectedCard.value}`
    };
  }

  /**
   * Decide whether to use attack card
   */
  shouldUseAttack(rider, state, distanceToFinish) {
    // Easy: rarely attacks
    if (this.difficulty === AIDifficulty.EASY) {
      return distanceToFinish < 10 && Math.random() < 0.3;
    }

    // Normal: attacks in final
    if (this.difficulty === AIDifficulty.NORMAL) {
      return distanceToFinish < 15 && Math.random() < 0.5;
    }

    // Hard: strategic attacks
    if (this.difficulty === AIDifficulty.HARD) {
      // Attack if close to finish or good position
      if (distanceToFinish < 20) return true;
      
      // Attack if energy is good and in favorable terrain
      if (rider.energy > 60) {
        const terrain = this.getTerrainAtPosition(state, rider.position);
        const bonus = getTerrainBonus(rider.type, terrain);
        if (bonus > 0) return Math.random() < 0.4;
      }
    }

    return false;
  }

  /**
   * Select best movement card from hand
   */
  selectBestMovementCard(cards, rider, state, terrain) {
    const energyStatus = getEnergyStatus(rider.energy);
    
    // If fringale, play lowest card to conserve
    if (energyStatus === 'fringale') {
      return cards.reduce((min, c) => c.value < min.value ? c : min, cards[0]);
    }

    // If exhausted, prefer medium cards
    if (energyStatus === 'exhausted') {
      const sorted = [...cards].sort((a, b) => a.value - b.value);
      return sorted[Math.floor(sorted.length / 2)];
    }

    // Normal strategy based on difficulty
    if (this.difficulty === AIDifficulty.EASY) {
      // Easy: random card
      return cards[Math.floor(Math.random() * cards.length)];
    }

    // Check terrain advantage
    const bonus = getTerrainBonus(rider.type, terrain);
    
    if (this.difficulty === AIDifficulty.HARD && bonus > 0) {
      // On favorable terrain, play high card
      return cards.reduce((max, c) => c.value > max.value ? c : max, cards[0]);
    }

    // Normal: play medium-high card
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const index = Math.min(1, sorted.length - 1);
    return sorted[index];
  }

  /**
   * Decide whether to use specialty card
   */
  decideSpecialty(state, teamId) {
    const rider = state.riders.find(r => r.id === state.selectedRiderId);
    if (!rider) {
      return { type: 'skip_specialty', reason: 'Coureur non trouvé' };
    }

    const terrain = this.getTerrainAtPosition(state, rider.position);
    const specialtyTerrain = this.getSpecialtyTerrain(rider.type);
    const energyEffects = getEnergyEffects(rider.energy);

    // Can't use if no cards or energy restrictions
    if (!rider.specialtyCards || rider.specialtyCards.length === 0) {
      return { type: 'skip_specialty', reason: 'Pas de carte spécialité' };
    }

    if (!energyEffects.canUseSpecialty) {
      return { type: 'skip_specialty', reason: 'Énergie insuffisante' };
    }

    // Only use on matching terrain
    if (terrain !== specialtyTerrain) {
      return { type: 'skip_specialty', reason: 'Mauvais terrain' };
    }

    // Decision based on difficulty and situation
    const distanceToFinish = state.courseLength - rider.position;
    const cardsRemaining = rider.specialtyCards.length;

    // Easy: 50% chance
    if (this.difficulty === AIDifficulty.EASY) {
      if (Math.random() < 0.5) {
        return { type: 'use_specialty', useSpecialty: true, reason: 'Utilisation spécialité' };
      }
      return { type: 'skip_specialty', reason: 'Économie de carte' };
    }

    // Normal: use if close to finish or on good terrain segment
    if (this.difficulty === AIDifficulty.NORMAL) {
      if (distanceToFinish < 30 || Math.random() < 0.6) {
        return { type: 'use_specialty', useSpecialty: true, reason: 'Utilisation spécialité' };
      }
    }

    // Hard: strategic use
    if (this.difficulty === AIDifficulty.HARD) {
      // Save one card for final if far
      if (cardsRemaining === 1 && distanceToFinish > 25) {
        return { type: 'skip_specialty', reason: 'Garde pour le final' };
      }
      // Otherwise use it
      return { type: 'use_specialty', useSpecialty: true, reason: 'Terrain favorable' };
    }

    return { type: 'skip_specialty', reason: 'Par défaut' };
  }

  /**
   * Get terrain at position from state
   */
  getTerrainAtPosition(state, position) {
    if (position < 0) return TerrainType.FLAT;
    if (position >= state.courseLength) return TerrainType.SPRINT;
    return state.course[position]?.terrain || TerrainType.FLAT;
  }

  /**
   * Get specialty terrain for rider type
   */
  getSpecialtyTerrain(riderType) {
    const map = {
      [RiderType.CLIMBER]: TerrainType.MOUNTAIN,
      [RiderType.PUNCHEUR]: TerrainType.HILL,
      [RiderType.ROULEUR]: TerrainType.FLAT,
      [RiderType.SPRINTER]: TerrainType.SPRINT
    };
    return map[riderType] || TerrainType.FLAT;
  }
}

/**
 * Create AI instance with given difficulty
 * @param {string} difficulty - AI difficulty level
 * @returns {CyclingAI} AI instance
 */
export function createAI(difficulty = AIDifficulty.NORMAL) {
  return new CyclingAI(difficulty);
}

/**
 * Execute AI turn with delays for animation
 * @param {CyclingAI} ai - AI instance
 * @param {Object} state - Game state
 * @param {string} phase - Current phase
 * @param {string} teamId - AI team
 * @param {Function} callback - Callback with decision
 */
export async function executeAITurn(ai, state, phase, teamId, callback) {
  // Add thinking delay
  await new Promise(resolve => setTimeout(resolve, ai.thinkingDelay));
  
  const decision = ai.makeDecision(state, phase, teamId);
  callback(decision);
}
