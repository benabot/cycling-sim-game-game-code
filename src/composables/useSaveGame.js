/**
 * Composable pour la gestion des sauvegardes
 * @module composables/useSaveGame
 */

import { ref, computed } from 'vue';
import {
  serializeSave,
  deserializeSave,
  downloadSave,
  readSaveFile,
  autoSave,
  loadAutoSave,
  getAutoSaveMeta,
  getAutoSaveAge,
  clearAutoSave,
  SaveError,
  SaveErrorCode
} from '../core/save-manager.js';

/**
 * Hook pour gérer les sauvegardes dans le jeu
 * @returns {Object} API de sauvegarde
 */
export function useSaveGame() {
  // État
  const isLoading = ref(false);
  const error = ref(null);
  const lastSaveTime = ref(null);
  
  // Sauvegarde automatique détectée
  const autoSaveData = ref(null);
  
  /**
   * Vérifier si une sauvegarde automatique existe
   */
  function checkAutoSave() {
    const meta = getAutoSaveMeta();
    if (meta) {
      autoSaveData.value = {
        meta,
        age: getAutoSaveAge()
      };
    } else {
      autoSaveData.value = null;
    }
    return autoSaveData.value;
  }

  /**
   * Sauvegarder la partie en téléchargeant un fichier
   * @param {Object} gameState - État du jeu (depuis useGameEngine)
   * @param {string} name - Nom de la sauvegarde
   */
  function saveToFile(gameState, name = '') {
    error.value = null;
    
    try {
      downloadSave(gameState, name);
      lastSaveTime.value = new Date();
      return true;
    } catch (err) {
      error.value = err.message || 'Erreur lors de la sauvegarde';
      console.error('Save error:', err);
      return false;
    }
  }

  /**
   * Charger une partie depuis un fichier
   * @param {File} file - Fichier de sauvegarde
   * @returns {Promise<Object>} État du jeu restauré
   */
  async function loadFromFile(file) {
    isLoading.value = true;
    error.value = null;

    try {
      const { meta, state } = await readSaveFile(file);
      isLoading.value = false;
      return { meta, state };
    } catch (err) {
      isLoading.value = false;
      error.value = err.message || 'Erreur lors du chargement';
      throw err;
    }
  }

  /**
   * Sauvegarder automatiquement (LocalStorage)
   * @param {Object} gameState - État du jeu
   */
  function performAutoSave(gameState) {
    const success = autoSave(gameState);
    if (success) {
      lastSaveTime.value = new Date();
      checkAutoSave(); // Mettre à jour les métadonnées
    }
    return success;
  }

  /**
   * Charger la sauvegarde automatique
   * @returns {Object|null} État restauré ou null
   */
  function loadFromAutoSave() {
    error.value = null;
    
    try {
      const result = loadAutoSave();
      if (result) {
        return result;
      }
      return null;
    } catch (err) {
      error.value = err.message || 'Erreur lors du chargement';
      return null;
    }
  }

  /**
   * Effacer la sauvegarde automatique
   */
  function clearAuto() {
    clearAutoSave();
    autoSaveData.value = null;
  }

  /**
   * Obtenir les métadonnées d'aperçu d'une partie
   * @param {Object} gameState - État du jeu
   * @param {string} name - Nom optionnel
   * @returns {Object} Métadonnées
   */
  function getPreviewMeta(gameState, name = '') {
    try {
      const saveData = serializeSave(gameState, name);
      return saveData.meta;
    } catch {
      return null;
    }
  }

  // Computed
  const hasAutoSave = computed(() => autoSaveData.value !== null);
  const autoSaveMeta = computed(() => autoSaveData.value?.meta || null);
  const autoSaveAgeText = computed(() => autoSaveData.value?.age || null);

  return {
    // État
    isLoading,
    error,
    lastSaveTime,
    
    // Auto-save
    hasAutoSave,
    autoSaveMeta,
    autoSaveAgeText,
    
    // Actions
    checkAutoSave,
    saveToFile,
    loadFromFile,
    performAutoSave,
    loadFromAutoSave,
    clearAuto,
    getPreviewMeta
  };
}
