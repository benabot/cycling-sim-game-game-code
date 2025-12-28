/**
 * Energy System - v3.3
 * Manages rider energy, consumption, recovery, and threshold effects
 * @module core/energy
 */

/**
 * Energy configuration
 */
export const EnergyConfig = {
  maxEnergy: 100,
  startEnergy: 100,
  
  // Thresholds
  thresholds: {
    normal: { min: 51, max: 100 },
    tired: { min: 26, max: 50 },    // Attaque/Spécialité : -1
    exhausted: { min: 1, max: 25 }, // Attaque/Spécialité interdites, bonus terrain annulé
    fringale: { min: 0, max: 0 }    // Max 3 cases/tour
  },
  
  // Consumption costs
  consumption: {
    baseMovement: 1,      // -1 per case
    mountainMovement: 2,  // -2 per case in mountain
    hillMovement: 1.5,    // -1.5 per case in hill
    attackCard: 5,        // -5 for attack card
    specialtyCard: 3,     // -3 for specialty card
    windPenalty: 2        // -2 when leading (taking wind)
  },
  
  // Recovery gains
  recovery: {
    descentMovement: 1,   // +1 per case in descent
    shelterBonus: 3,      // +3 when sheltered at end of turn
    refuelZone: 25        // +25 in refuel zone
  },
  
  // Terrain adaptation reduces consumption by 50%
  terrainAdaptationReduction: 0.5,
  
  // Fringale max movement
  fringaleMaxMovement: 3
};

/**
 * Get energy status based on current energy level
 * @param {number} energy - Current energy level
 * @returns {string} Status: 'normal', 'tired', 'exhausted', or 'fringale'
 */
export function getEnergyStatus(energy) {
  if (energy <= 0) return 'fringale';
  if (energy <= 25) return 'exhausted';
  if (energy <= 50) return 'tired';
  return 'normal';
}

/**
 * Get energy threshold effects
 * @param {number} energy - Current energy level
 * @returns {Object} Effects: { attackPenalty, specialtyPenalty, bonusDisabled, maxMovement }
 */
export function getEnergyEffects(energy) {
  const status = getEnergyStatus(energy);
  
  switch (status) {
    case 'fringale':
      return {
        attackPenalty: null,      // Can't use
        specialtyPenalty: null,   // Can't use
        bonusDisabled: true,
        maxMovement: EnergyConfig.fringaleMaxMovement,
        canUseAttack: false,
        canUseSpecialty: false
      };
    case 'exhausted':
      return {
        attackPenalty: null,
        specialtyPenalty: null,
        bonusDisabled: true,
        maxMovement: null,
        canUseAttack: false,
        canUseSpecialty: false
      };
    case 'tired':
      return {
        attackPenalty: -1,
        specialtyPenalty: -1,
        bonusDisabled: false,
        maxMovement: null,
        canUseAttack: true,
        canUseSpecialty: true
      };
    default: // normal
      return {
        attackPenalty: 0,
        specialtyPenalty: 0,
        bonusDisabled: false,
        maxMovement: null,
        canUseAttack: true,
        canUseSpecialty: true
      };
  }
}

/**
 * Check if rider type is adapted to terrain (reduces energy consumption)
 * @param {string} riderType - Rider type
 * @param {string} terrain - Terrain type
 * @returns {boolean} True if adapted
 */
export function isAdaptedToTerrain(riderType, terrain) {
  const adaptations = {
    climber: ['mountain'],
    puncher: ['hill'],
    rouleur: ['flat'],
    sprinter: ['sprint', 'descent'],
    versatile: [] // No specific adaptation, but no malus either
  };
  return adaptations[riderType]?.includes(terrain) || false;
}

/**
 * Calculate energy consumption for movement
 * @param {Object} params - Movement parameters
 * @returns {number} Energy consumed (positive number)
 */
export function calculateMovementConsumption({ 
  distance, 
  terrain, 
  riderType, 
  usedAttack = false, 
  usedSpecialty = false,
  isLeading = false 
}) {
  let consumption = 0;
  
  // Base movement cost by terrain
  const terrainCosts = {
    mountain: EnergyConfig.consumption.mountainMovement,
    hill: EnergyConfig.consumption.hillMovement,
    flat: EnergyConfig.consumption.baseMovement,
    descent: 0, // No cost in descent
    sprint: EnergyConfig.consumption.baseMovement
  };
  
  const baseCost = terrainCosts[terrain] || EnergyConfig.consumption.baseMovement;
  consumption += baseCost * distance;
  
  // Terrain adaptation reduces consumption by 50%
  if (isAdaptedToTerrain(riderType, terrain)) {
    consumption *= EnergyConfig.terrainAdaptationReduction;
  }
  
  // Card costs
  if (usedAttack) {
    consumption += EnergyConfig.consumption.attackCard;
  }
  if (usedSpecialty) {
    consumption += EnergyConfig.consumption.specialtyCard;
  }
  
  // Wind penalty (leading)
  if (isLeading) {
    consumption += EnergyConfig.consumption.windPenalty;
  }
  
  return Math.round(consumption);
}

/**
 * Calculate energy recovery
 * @param {Object} params - Recovery parameters
 * @returns {number} Energy recovered (positive number)
 */
export function calculateRecovery({
  terrain,
  distance = 0,
  isSheltered = false,
  inRefuelZone = false
}) {
  let recovery = 0;
  
  // Descent recovery
  if (terrain === 'descent') {
    recovery += EnergyConfig.recovery.descentMovement * distance;
  }
  
  // Shelter bonus
  if (isSheltered) {
    recovery += EnergyConfig.recovery.shelterBonus;
  }
  
  // Refuel zone
  if (inRefuelZone) {
    recovery += EnergyConfig.recovery.refuelZone;
  }
  
  return Math.round(recovery);
}

/**
 * Apply energy change to a rider
 * @param {number} currentEnergy - Current energy level
 * @param {number} consumed - Energy consumed
 * @param {number} recovered - Energy recovered
 * @returns {number} New energy level (clamped 0-100)
 */
export function applyEnergyChange(currentEnergy, consumed, recovered) {
  const newEnergy = currentEnergy - consumed + recovered;
  return Math.max(0, Math.min(EnergyConfig.maxEnergy, newEnergy));
}

/**
 * Get energy bar color based on level
 * @param {number} energy - Energy level
 * @returns {string} CSS color (désaturé "plateau premium")
 */
export function getEnergyColor(energy) {
  if (energy > 50) return '#5AAA72'; // Vert poudreux (désaturé de #22c55e)
  if (energy > 25) return '#D4A84A'; // Orange poudreux (désaturé de #f59e0b)
  if (energy > 0) return '#C46868';  // Rouge poudreux (désaturé de #ef4444)
  return '#8B4A4A';                   // Rouge sombre poudreux
}

/**
 * Get energy status label
 * @param {number} energy - Energy level
 * @returns {string} Status label
 */
export function getEnergyLabel(energy) {
  const status = getEnergyStatus(energy);
  const labels = {
    normal: 'Normal',
    tired: 'Fatigué (-1)',
    exhausted: 'Épuisé',
    fringale: 'Fringale!'
  };
  return labels[status];
}
