/**
 * Save Manager - Sauvegarde et chargement de parties
 * @module core/save-manager
 */

// Version du format de sauvegarde (pour migrations futures)
const SAVE_VERSION = '1.0.0';
const AUTOSAVE_KEY = 'cycling-sim-autosave';
const FILE_EXTENSION = '.csg'; // Cycling Sim Game

/**
 * Erreur de sauvegarde personnalisée
 */
export class SaveError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message);
    this.name = 'SaveError';
    this.code = code;
  }
}

/**
 * Codes d'erreur
 */
export const SaveErrorCode = {
  INVALID_FORMAT: 'INVALID_FORMAT',
  INCOMPATIBLE_VERSION: 'INCOMPATIBLE_VERSION',
  CORRUPTED_DATA: 'CORRUPTED_DATA',
  READ_ERROR: 'READ_ERROR',
  STORAGE_FULL: 'STORAGE_FULL'
};

/**
 * Extraire les métadonnées pour l'aperçu
 * @param {Object} gameState - État du jeu
 * @param {string} name - Nom de la sauvegarde
 * @returns {Object} Métadonnées
 */
function extractMetadata(gameState, name) {
  // Trouver le leader (coureur le plus avancé)
  const leader = gameState.riders?.reduce((best, rider) => {
    if (!rider.hasFinished && rider.position > (best?.position || 0)) {
      return rider;
    }
    return best;
  }, null);

  // Nom du preset ou mode
  let raceName = 'Course personnalisée';
  if (gameState.gameConfig?.classicId) {
    const classicNames = {
      ardennaise: 'Ardennaise',
      lombarde: 'Lombarde',
      riviera: 'Riviera',
      nord: 'Nord'
    };
    raceName = classicNames[gameState.gameConfig.classicId] || gameState.gameConfig.classicId;
  } else if (gameState.stageRace) {
    raceName = `Course à étapes (${gameState.stageRace.numStages} étapes)`;
  }

  // Équipes en jeu
  const teams = gameState.teamIds?.map(teamId => {
    const player = gameState.players?.find(p => p.teamId === teamId);
    return {
      id: teamId,
      type: player?.playerType || 'human'
    };
  }) || [];

  return {
    name: name || `Partie - Tour ${gameState.currentTurn || 1}`,
    savedAt: new Date().toISOString(),
    gameVersion: SAVE_VERSION,
    
    // Infos de course
    raceMode: gameState.raceMode || 'CLASSIC',
    raceName,
    courseLength: gameState.courseLength || 80,
    
    // Progression
    currentTurn: gameState.currentTurn || 1,
    phase: gameState.phase || 'playing',
    isLastTurn: gameState.isLastTurn || false,
    
    // Leader
    leaderName: leader?.name || null,
    leaderPosition: leader?.position || 0,
    leaderTeam: leader?.team || null,
    
    // Équipes
    teams,
    numTeams: teams.length,
    
    // Stage race (si applicable)
    currentStage: gameState.stageRace?.currentStageIndex 
      ? gameState.stageRace.currentStageIndex + 1 
      : null,
    totalStages: gameState.stageRace?.numStages || null
  };
}

/**
 * Nettoyer l'état pour la sérialisation
 * Retire les références circulaires et les fonctions
 * @param {Object} gameState - État du jeu
 * @returns {Object} État nettoyé
 */
function cleanStateForSerialization(gameState) {
  // Créer une copie profonde sans les éléments non sérialisables
  const state = JSON.parse(JSON.stringify(gameState, (key, value) => {
    // Ignorer les fonctions
    if (typeof value === 'function') return undefined;
    // Ignorer les clés internes de Vue
    if (key.startsWith('__v_')) return undefined;
    // Ignorer les RNG (non sérialisables, seront recréés)
    if (key === 'rng' || key === 'courseRng' || key === 'eventRng' || key === 'weatherRng') {
      return undefined;
    }
    // Ignorer le rng dans raceEventState aussi
    if (key === 'raceEventState' && value?.rng) {
      const { rng, ...rest } = value;
      return rest;
    }
    return value;
  }));

  return state;
}

/**
 * Sérialiser une partie pour la sauvegarde
 * @param {Object} gameState - État du jeu (depuis useGameEngine)
 * @param {string} name - Nom de la sauvegarde
 * @returns {Object} Données de sauvegarde complètes
 */
export function serializeSave(gameState, name = '') {
  if (!gameState) {
    throw new SaveError('État du jeu invalide', SaveErrorCode.INVALID_FORMAT);
  }

  return {
    meta: extractMetadata(gameState, name),
    state: cleanStateForSerialization(gameState)
  };
}

/**
 * Vérifier la compatibilité de version
 * @param {string} version - Version de la sauvegarde
 * @returns {boolean} True si compatible
 */
function isCompatibleVersion(version) {
  if (!version) return false;
  
  // Pour l'instant, seule la version 1.0.x est supportée
  const [major] = version.split('.');
  const [currentMajor] = SAVE_VERSION.split('.');
  
  return major === currentMajor;
}

/**
 * Valider la structure d'une sauvegarde
 * @param {Object} saveData - Données de sauvegarde
 * @throws {SaveError} Si la structure est invalide
 */
function validateSaveStructure(saveData) {
  if (!saveData || typeof saveData !== 'object') {
    throw new SaveError('Format de sauvegarde invalide', SaveErrorCode.INVALID_FORMAT);
  }

  if (!saveData.meta || !saveData.state) {
    throw new SaveError(
      'Structure de sauvegarde invalide (meta ou state manquant)',
      SaveErrorCode.INVALID_FORMAT
    );
  }

  if (!isCompatibleVersion(saveData.meta.gameVersion)) {
    throw new SaveError(
      `Version de sauvegarde incompatible (${saveData.meta.gameVersion} vs ${SAVE_VERSION})`,
      SaveErrorCode.INCOMPATIBLE_VERSION
    );
  }

  // Vérifications minimales de l'état
  const state = saveData.state;
  if (!state.course || !Array.isArray(state.course)) {
    throw new SaveError('Parcours manquant ou invalide', SaveErrorCode.CORRUPTED_DATA);
  }
  if (!state.riders || !Array.isArray(state.riders)) {
    throw new SaveError('Coureurs manquants ou invalides', SaveErrorCode.CORRUPTED_DATA);
  }
}

/**
 * Désérialiser une sauvegarde
 * @param {Object} saveData - Données de sauvegarde
 * @returns {Object} État du jeu restauré
 */
export function deserializeSave(saveData) {
  validateSaveStructure(saveData);
  
  // Retourner l'état tel quel - le game engine le réhydratera
  return saveData.state;
}

/**
 * Générer un nom de fichier sûr
 * @param {string} name - Nom de la partie
 * @returns {string} Nom de fichier
 */
function generateFilename(name) {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9]+/g, '-')     // Remplacer les caractères spéciaux
    .replace(/^-|-$/g, '')            // Retirer les tirets en début/fin
    .slice(0, 30);
  
  const date = new Date().toISOString().slice(0, 10);
  return `${slug || 'partie'}-${date}${FILE_EXTENSION}`;
}

/**
 * Télécharger une sauvegarde (côté client)
 * @param {Object} gameState - État du jeu
 * @param {string} name - Nom de la sauvegarde
 */
export function downloadSave(gameState, name = '') {
  const saveData = serializeSave(gameState, name);
  const json = JSON.stringify(saveData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = generateFilename(saveData.meta.name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Lire un fichier de sauvegarde
 * @param {File} file - Fichier à lire
 * @returns {Promise<{meta: Object, state: Object}>} Données de sauvegarde
 */
export function readSaveFile(file) {
  return new Promise((resolve, reject) => {
    // Vérifier l'extension
    const validExtensions = [FILE_EXTENSION, '.json'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      reject(new SaveError(
        'Format de fichier non reconnu. Utilisez un fichier .csg ou .json',
        SaveErrorCode.INVALID_FORMAT
      ));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const saveData = JSON.parse(e.target.result);
        validateSaveStructure(saveData);
        resolve({
          meta: saveData.meta,
          state: deserializeSave(saveData)
        });
      } catch (err) {
        if (err instanceof SaveError) {
          reject(err);
        } else if (err instanceof SyntaxError) {
          reject(new SaveError(
            'Fichier de sauvegarde corrompu (JSON invalide)',
            SaveErrorCode.CORRUPTED_DATA
          ));
        } else {
          reject(new SaveError(
            `Erreur de lecture: ${err.message}`,
            SaveErrorCode.READ_ERROR
          ));
        }
      }
    };

    reader.onerror = () => {
      reject(new SaveError(
        'Impossible de lire le fichier',
        SaveErrorCode.READ_ERROR
      ));
    };

    reader.readAsText(file);
  });
}

// ============================================
// Auto-save (LocalStorage)
// ============================================

/**
 * Sauvegarder automatiquement dans LocalStorage
 * @param {Object} gameState - État du jeu
 * @returns {boolean} True si succès
 */
export function autoSave(gameState) {
  if (!gameState || gameState.phase === 'finished') {
    return false;
  }

  try {
    const saveData = serializeSave(gameState, 'Sauvegarde automatique');
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (err) {
    console.warn('Auto-save échoué:', err.message);
    return false;
  }
}

/**
 * Charger la sauvegarde automatique
 * @returns {{meta: Object, state: Object}|null} Données ou null si absente/invalide
 */
export function loadAutoSave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;

    const saveData = JSON.parse(raw);
    validateSaveStructure(saveData);
    
    return {
      meta: saveData.meta,
      state: deserializeSave(saveData)
    };
  } catch (err) {
    console.warn('Auto-save invalide, ignoré:', err.message);
    clearAutoSave();
    return null;
  }
}

/**
 * Vérifier si une sauvegarde automatique existe
 * @returns {Object|null} Métadonnées de la sauvegarde ou null
 */
export function getAutoSaveMeta() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;

    const saveData = JSON.parse(raw);
    if (!saveData.meta) return null;
    
    return saveData.meta;
  } catch {
    return null;
  }
}

/**
 * Supprimer la sauvegarde automatique
 */
export function clearAutoSave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // Ignorer les erreurs de suppression
  }
}

/**
 * Calculer l'âge de la sauvegarde automatique
 * @returns {string|null} Texte lisible ("il y a 2 heures") ou null
 */
export function getAutoSaveAge() {
  const meta = getAutoSaveMeta();
  if (!meta?.savedAt) return null;

  const savedDate = new Date(meta.savedAt);
  const now = new Date();
  const diffMs = now - savedDate;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'à l\'instant';
  if (diffMinutes < 60) return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

// ============================================
// Exports
// ============================================

export {
  SAVE_VERSION,
  FILE_EXTENSION
};
