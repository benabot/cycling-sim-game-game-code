/**
 * Race Presets - v5.0
 * Définitions des classiques et profils de courses à étapes
 * @module config/race-presets
 */

import { TerrainType } from '../core/terrain.js';

/**
 * Types de courses disponibles
 */
export const RaceType = {
  CLASSIC: 'classic',
  STAGE_RACE: 'stage_race'
};

/**
 * Identifiants des classiques
 */
export const ClassicId = {
  ARDENNAISE: 'ardennaise',
  LOMBARDE: 'lombarde',
  RIVIERA: 'riviera',
  NORD: 'nord'
};

/**
 * Profils globaux pour les courses à étapes
 */
export const StageRaceProfile = {
  BALANCED: 'balanced',
  MOUNTAIN: 'mountain',
  SPRINTERS: 'sprinters'
};

/**
 * Types d'étapes individuelles
 */
export const StageType = {
  FLAT: 'flat',
  HILLY: 'hilly',
  MOUNTAIN: 'mountain',
  SPRINT: 'sprint'
};

/**
 * Configuration des 4 classiques inspirées des monuments du cyclisme
 * 
 * Distributions terrain en pourcentage (total = 100%)
 * - flat: Plaine
 * - hill: Côte (courte montée)
 * - mountain: Montagne (longue ascension)
 * - descent: Descente
 * - sprint: Zone de sprint final
 */
export const ClassicPresets = {
  /**
   * Ardennaise - Style Flèche Wallonne / Liège-Bastogne-Liège
   * Terrain accidenté avec nombreuses côtes courtes et raides
   * Avantage: Puncheurs
   */
  [ClassicId.ARDENNAISE]: {
    id: ClassicId.ARDENNAISE,
    name: 'Flandrien / Bosses',
    subtitle: 'Bosses courtes.',
    description: 'Relances nerveuses.',
    narrative: 'Usure, attaques tardives.',
    profile: [0.2, 0.6, 0.4, 0.8, 0.3],
    inspiration: 'Flèche Wallonne / Liège-Bastogne-Liège',
    advantage: 'puncher',
    advantageLabel: 'Puncheurs',
    difficulty: 'hard',
    difficultyLabel: 'Dur',
    icon: 'hill',
    defaultLength: 80,
    distribution: {
      [TerrainType.FLAT]: 20,
      [TerrainType.HILL]: 35,
      [TerrainType.MOUNTAIN]: 20,
      [TerrainType.DESCENT]: 15,
      [TerrainType.SPRINT]: 10
    },
    // Structure spécifique: alternance plat/côte avec une section montagne
    structure: {
      startFlat: 4,           // Cases plates au départ
      endSprint: 8,           // Cases de sprint final
      mountainMinLength: 12,  // Longueur minimale section montagne (réduite vs Lombarde)
      hillMaxLength: 4        // Côtes courtes et raides
    }
  },

  /**
   * Lombarde - Style Tour de Lombardie
   * Longues ascensions en moyenne/haute montagne
   * Avantage: Grimpeurs
   */
  [ClassicId.LOMBARDE]: {
    id: ClassicId.LOMBARDE,
    name: 'Montagne / Longs cols',
    subtitle: 'Longs cols.',
    description: 'Avantage grimpeurs.',
    narrative: 'Tempo long, écarts nets.',
    profile: [0.1, 0.5, 0.9, 0.6, 0.2],
    inspiration: 'Tour de Lombardie',
    advantage: 'climber',
    advantageLabel: 'Grimpeurs',
    difficulty: 'hard',
    difficultyLabel: 'Sec',
    icon: 'mountain',
    defaultLength: 80,
    distribution: {
      [TerrainType.FLAT]: 15,
      [TerrainType.HILL]: 15,
      [TerrainType.MOUNTAIN]: 40,
      [TerrainType.DESCENT]: 20,
      [TerrainType.SPRINT]: 10
    },
    structure: {
      startFlat: 5,
      endSprint: 8,
      mountainMinLength: 18,  // Longue montée décisive
      hillMaxLength: 5
    }
  },

  /**
   * Riviera - Style Milan-San Remo
   * Parcours majoritairement plat avec final disputé au sprint
   * Avantage: Sprinteurs
   */
  [ClassicId.RIVIERA]: {
    id: ClassicId.RIVIERA,
    name: 'Plat / Vent',
    subtitle: 'Course rapide.',
    description: 'Avantage sprinteurs.',
    narrative: 'Rythme tendu, final rapide.',
    profile: [0.1, 0.2, 0.2, 0.3, 0.1],
    inspiration: 'Milan-San Remo',
    advantage: 'sprinter',
    advantageLabel: 'Sprinteurs',
    difficulty: 'fast',
    difficultyLabel: 'Vif',
    icon: 'road',
    defaultLength: 80,
    distribution: {
      [TerrainType.FLAT]: 50,
      [TerrainType.HILL]: 10,
      [TerrainType.MOUNTAIN]: 10,
      [TerrainType.DESCENT]: 10,
      [TerrainType.SPRINT]: 20
    },
    structure: {
      startFlat: 8,
      endSprint: 16,          // Long sprint final
      mountainMinLength: 8,   // Petite montagne (Poggio style)
      hillMaxLength: 4
    }
  },

  /**
   * Nord - Style Paris-Roubaix
   * Parcours plat avec sections difficiles (pavés simulés par côtes)
   * Avantage: Rouleurs (et sprinteurs)
   */
  [ClassicId.NORD]: {
    id: ClassicId.NORD,
    name: 'Nord / Pavés',
    subtitle: 'Effort long.',
    description: 'Avantage rouleurs.',
    narrative: 'Piégeux, tempo élevé.',
    profile: [0.2, 0.5, 0.3, 0.6, 0.2],
    inspiration: 'Paris-Roubaix',
    advantage: 'rouleur',
    advantageLabel: 'Rouleurs',
    difficulty: 'balanced',
    difficultyLabel: 'Piégeux',
    icon: 'cobbles',
    defaultLength: 80,
    distribution: {
      [TerrainType.FLAT]: 45,
      [TerrainType.HILL]: 20,      // Simule les secteurs pavés (effort intense)
      [TerrainType.MOUNTAIN]: 5,
      [TerrainType.DESCENT]: 10,
      [TerrainType.SPRINT]: 20
    },
    structure: {
      startFlat: 6,
      endSprint: 16,
      mountainMinLength: 4,   // Très peu de montagne
      hillMaxLength: 6        // Secteurs "pavés" un peu plus longs
    }
  }
};

/**
 * Configuration des courses à étapes
 */
export const StageRaceConfig = {
  /**
   * Options pour le nombre d'étapes
   */
  stageOptions: [3, 5, 7],

  /**
   * Profils globaux avec leur distribution d'étapes
   * Chaque profil définit les types d'étapes générées
   */
  profiles: {
    [StageRaceProfile.BALANCED]: {
      id: StageRaceProfile.BALANCED,
      name: 'Équilibré',
      description: 'Mix de terrains.',
      narrative: 'Rythme haché, profils variés.',
      profile: [0.2, 0.5, 0.4, 0.6, 0.3],
      icon: 'balance',
      // Distribution des types d'étapes (utilisée pour générer le programme)
      stageDistribution: {
        3: [StageType.FLAT, StageType.HILLY, StageType.MOUNTAIN],
        5: [StageType.FLAT, StageType.HILLY, StageType.MOUNTAIN, StageType.HILLY, StageType.SPRINT],
        7: [StageType.FLAT, StageType.HILLY, StageType.MOUNTAIN, StageType.FLAT, StageType.HILLY, StageType.MOUNTAIN, StageType.SPRINT]
      }
    },
    [StageRaceProfile.MOUNTAIN]: {
      id: StageRaceProfile.MOUNTAIN,
      name: 'Montagne',
      description: 'Montagne dominante.',
      narrative: 'Usure continue, écarts durables.',
      profile: [0.2, 0.7, 0.9, 0.6, 0.3],
      icon: 'summit',
      stageDistribution: {
        3: [StageType.HILLY, StageType.MOUNTAIN, StageType.MOUNTAIN],
        5: [StageType.HILLY, StageType.MOUNTAIN, StageType.MOUNTAIN, StageType.HILLY, StageType.MOUNTAIN],
        7: [StageType.HILLY, StageType.MOUNTAIN, StageType.MOUNTAIN, StageType.FLAT, StageType.MOUNTAIN, StageType.MOUNTAIN, StageType.HILLY]
      }
    },
    [StageRaceProfile.SPRINTERS]: {
      id: StageRaceProfile.SPRINTERS,
      name: 'Sprinteurs',
      description: 'Arrivées au sprint.',
      narrative: 'Vitesse, gestion d’effort.',
      profile: [0.1, 0.2, 0.2, 0.3, 0.2],
      icon: 'finish',
      stageDistribution: {
        3: [StageType.FLAT, StageType.FLAT, StageType.SPRINT],
        5: [StageType.FLAT, StageType.FLAT, StageType.HILLY, StageType.FLAT, StageType.SPRINT],
        7: [StageType.FLAT, StageType.FLAT, StageType.HILLY, StageType.FLAT, StageType.FLAT, StageType.HILLY, StageType.SPRINT]
      }
    }
  },

  /**
   * Distributions terrain par type d'étape
   */
  stageTypeDistributions: {
    [StageType.FLAT]: {
      name: 'Plate',
      icon: 'road',
      distribution: {
        [TerrainType.FLAT]: 50,
        [TerrainType.HILL]: 15,
        [TerrainType.MOUNTAIN]: 5,
        [TerrainType.DESCENT]: 10,
        [TerrainType.SPRINT]: 20
      }
    },
    [StageType.HILLY]: {
      name: 'Accidentée',
      icon: 'hill',
      distribution: {
        [TerrainType.FLAT]: 25,
        [TerrainType.HILL]: 35,
        [TerrainType.MOUNTAIN]: 15,
        [TerrainType.DESCENT]: 15,
        [TerrainType.SPRINT]: 10
      }
    },
    [StageType.MOUNTAIN]: {
      name: 'Montagne',
      icon: 'summit',
      distribution: {
        [TerrainType.FLAT]: 15,
        [TerrainType.HILL]: 15,
        [TerrainType.MOUNTAIN]: 40,
        [TerrainType.DESCENT]: 20,
        [TerrainType.SPRINT]: 10
      }
    },
    [StageType.SPRINT]: {
      name: 'Sprint',
      icon: 'finish',
      distribution: {
        [TerrainType.FLAT]: 55,
        [TerrainType.HILL]: 10,
        [TerrainType.MOUNTAIN]: 5,
        [TerrainType.DESCENT]: 5,
        [TerrainType.SPRINT]: 25
      }
    }
  }
};

/**
 * Points attribués par position d'arrivée (mode étapes)
 */
export const StagePoints = {
  1: 25,
  2: 20,
  3: 16,
  4: 13,
  5: 11,
  6: 10,
  7: 9,
  8: 8,
  9: 7,
  10: 6,
  11: 5,
  12: 4,
  13: 3,
  14: 2,
  15: 1
};

/**
 * Configuration des maillots distinctifs
 */
export const JerseyConfig = {
  yellow: {
    id: 'yellow',
    name: 'Maillot Jaune',
    description: 'Leader du classement général',
    icon: 'trophy',
    color: '#F2C94C',
    bonus: {
      type: 'dice',
      value: 1,
      usesPerStage: 1,
      description: '+1 au dé (1×/étape)'
    }
  },
  green: {
    id: 'green',
    name: 'Maillot Vert',
    description: 'Leader du classement par points (sprints)',
    icon: 'finish',
    color: '#35B56A',
    bonus: {
      type: 'terrain',
      terrain: TerrainType.SPRINT,
      value: 1,
      description: '+1 en zone sprint'
    }
  },
  polka: {
    id: 'polka',
    name: 'Maillot à Pois',
    description: 'Leader du classement de la montagne',
    icon: 'summit',
    color: '#D84A4A',
    bonus: {
      type: 'terrain',
      terrain: TerrainType.MOUNTAIN,
      value: 1,
      description: '+1 en montagne'
    }
  }
};

/**
 * Récupération d'énergie entre les étapes
 */
export const StageRecovery = {
  energyRecoveryRate: 0.7,  // 70% de l'énergie max récupérée
  minEnergy: 3,             // Minimum d'énergie après récupération
  fatigueCardsRemoved: 2    // Cartes fatigue retirées entre étapes
};

/**
 * Helper: Obtenir un preset de classique par ID
 * @param {string} classicId - ID de la classique
 * @returns {Object|null} Preset ou null
 */
export function getClassicPreset(classicId) {
  return ClassicPresets[classicId] || null;
}

/**
 * Helper: Obtenir tous les presets de classiques
 * @returns {Array} Liste des presets
 */
export function getAllClassicPresets() {
  return Object.values(ClassicPresets);
}

/**
 * Helper: Obtenir la distribution terrain d'un type d'étape
 * @param {string} stageType - Type d'étape (flat, hilly, mountain, sprint)
 * @returns {Object} Distribution terrain
 */
export function getStageTypeDistribution(stageType) {
  return StageRaceConfig.stageTypeDistributions[stageType]?.distribution || 
         StageRaceConfig.stageTypeDistributions[StageType.FLAT].distribution;
}

/**
 * Helper: Générer le programme d'étapes
 * @param {number} numStages - Nombre d'étapes (3, 5 ou 7)
 * @param {string} profile - Profil global (balanced, mountain, sprinters)
 * @returns {Array} Liste des étapes avec leur type
 */
export function generateStageProgram(numStages, profile) {
  const profileConfig = StageRaceConfig.profiles[profile] || 
                        StageRaceConfig.profiles[StageRaceProfile.BALANCED];
  
  const stageTypes = profileConfig.stageDistribution[numStages] || 
                     profileConfig.stageDistribution[5];
  
  return stageTypes.map((type, index) => {
    const stageConfig = StageRaceConfig.stageTypeDistributions[type];
    return {
      number: index + 1,
      type,
      name: stageConfig.name,
      icon: stageConfig.icon,
      distribution: stageConfig.distribution
    };
  });
}

/**
 * Helper: Calculer les points d'arrivée
 * @param {number} position - Position d'arrivée (1-based)
 * @returns {number} Points attribués
 */
export function getPointsForPosition(position) {
  return StagePoints[position] || 0;
}
