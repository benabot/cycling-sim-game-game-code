/**
 * Composable unifié pour la gestion du stockage (local + cloud)
 * @module composables/useStorage
 */

import { ref, computed, watch } from 'vue';
import { useAuth } from './useAuth.js';
import { useCloudSave } from './useCloudSave.js';
import {
  listLocalGames,
  loadLocalGame,
  deleteLocalGame,
  saveLocalGame,
  LOCAL_SAVE_PREFIX
} from '../core/save-manager.js';

// État partagé
const games = ref([]);
const isLoading = ref(false);
const error = ref(null);

/**
 * Hook unifié pour le stockage des parties
 */
export function useStorage() {
  const { isAuthenticated, isConfigured } = useAuth();
  const cloudSave = useCloudSave();

  // Mode de stockage actuel
  const storageMode = computed(() => {
    if (isConfigured.value && isAuthenticated.value) {
      return 'cloud';
    }
    return 'local';
  });

  /**
   * Normaliser une partie locale au format unifié
   */
  function normalizeLocalGame(localGame) {
    const meta = localGame.meta || {};
    return {
      id: localGame.id,
      source: 'local',
      name: meta.name || 'Sans nom',
      raceMode: meta.raceMode || 'CLASSIC',
      racePreset: meta.raceName || null,
      courseLength: meta.courseLength || 80,
      currentTurn: meta.currentTurn || 1,
      leader: meta.leaderName ? {
        name: meta.leaderName,
        team: meta.leaderTeam,
        position: meta.leaderPosition
      } : null,
      teams: meta.numTeams || 2,
      createdAt: meta.savedAt ? new Date(meta.savedAt) : new Date(),
      updatedAt: meta.savedAt ? new Date(meta.savedAt) : new Date()
    };
  }

  /**
   * Normaliser une partie cloud au format unifié
   */
  function normalizeCloudGame(cloudGame) {
    return {
      id: cloudGame.id,
      source: 'cloud',
      name: cloudGame.name || 'Sans nom',
      raceMode: cloudGame.race_mode || 'classic',
      racePreset: cloudGame.race_preset || null,
      courseLength: cloudGame.course_length || 80,
      currentTurn: cloudGame.current_turn || 1,
      leader: cloudGame.leader_name ? {
        name: cloudGame.leader_name,
        team: cloudGame.leader_team,
        position: cloudGame.leader_position
      } : null,
      teams: 2, // Non stocké dans la table games pour l'instant
      createdAt: cloudGame.created_at ? new Date(cloudGame.created_at) : new Date(),
      updatedAt: cloudGame.updated_at ? new Date(cloudGame.updated_at) : new Date()
    };
  }

  /**
   * Récupérer toutes les parties (local + cloud selon le mode)
   */
  async function fetchGames() {
    isLoading.value = true;
    error.value = null;

    try {
      const allGames = [];

      // Toujours charger les parties locales
      const localGames = listLocalGames();
      allGames.push(...localGames.map(normalizeLocalGame));

      // Si connecté, charger aussi les parties cloud
      if (storageMode.value === 'cloud') {
        try {
          await cloudSave.fetchGames();
          const cloudGames = cloudSave.cloudGames.value || [];
          allGames.push(...cloudGames.map(normalizeCloudGame));
        } catch (cloudErr) {
          // Erreur cloud non bloquante - on a toujours les parties locales
          console.warn('Erreur chargement parties cloud:', cloudErr);
        }
      }

      // Trier par date de modification (récent en premier)
      allGames.sort((a, b) => b.updatedAt - a.updatedAt);

      games.value = allGames;
    } catch (err) {
      console.error('Fetch games error:', err);
      error.value = err.message || 'Erreur lors du chargement des parties';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sauvegarder une partie (cloud si connecté, sinon local)
   * @param {string} name - Nom de la partie
   * @param {Object} gameState - État du jeu
   * @param {Object} [options] - Options
   * @param {boolean} [options.forceLocal] - Forcer la sauvegarde locale
   * @param {string} [options.existingId] - ID d'une partie existante à mettre à jour
   */
  async function saveGame(name, gameState, options = {}) {
    const { forceLocal = false, existingId = null } = options;

    isLoading.value = true;
    error.value = null;

    try {
      // Déterminer si on sauvegarde en local ou cloud
      const useCloud = storageMode.value === 'cloud' && !forceLocal;

      if (useCloud) {
        // Tenter la sauvegarde cloud
        const result = await cloudSave.saveToCloud(name, gameState, existingId);

        if (result.success) {
          await fetchGames(); // Rafraîchir la liste
          return { success: true, source: 'cloud', game: result.game };
        } else {
          // Fallback vers local si le cloud échoue
          console.warn('Cloud save failed, falling back to local:', result.error);
          const localResult = saveLocalGame(name, gameState);
          if (localResult) {
            await fetchGames();
            return {
              success: true,
              source: 'local',
              fallback: true,
              originalError: result.error,
              game: { id: localResult.id, ...localResult.meta }
            };
          }
          throw new Error(result.error || 'Échec de la sauvegarde');
        }
      } else {
        // Sauvegarde locale
        const localResult = saveLocalGame(name, gameState);
        if (localResult) {
          await fetchGames();
          return { success: true, source: 'local', game: { id: localResult.id, ...localResult.meta } };
        }
        throw new Error('Échec de la sauvegarde locale');
      }
    } catch (err) {
      console.error('Save game error:', err);
      error.value = err.message || 'Erreur lors de la sauvegarde';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Charger une partie par son ID
   * @param {string} gameId - ID de la partie (UUID pour cloud, clé LS pour local)
   */
  async function loadGame(gameId) {
    isLoading.value = true;
    error.value = null;

    try {
      // Déterminer la source par le format de l'ID
      const isLocal = gameId.startsWith(LOCAL_SAVE_PREFIX);

      if (isLocal) {
        const result = loadLocalGame(gameId);
        if (result) {
          return { success: true, source: 'local', meta: result.meta, state: result.state };
        }
        throw new Error('Partie locale introuvable');
      } else {
        // Partie cloud
        const result = await cloudSave.loadFromCloud(gameId);
        if (result.success) {
          return { success: true, source: 'cloud', meta: result.meta, state: result.state };
        }
        throw new Error(result.error || 'Partie cloud introuvable');
      }
    } catch (err) {
      console.error('Load game error:', err);
      error.value = err.message || 'Erreur lors du chargement';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Supprimer une partie
   * @param {string} gameId - ID de la partie
   */
  async function deleteGame(gameId) {
    isLoading.value = true;
    error.value = null;

    try {
      const isLocal = gameId.startsWith(LOCAL_SAVE_PREFIX);

      if (isLocal) {
        const success = deleteLocalGame(gameId);
        if (!success) {
          throw new Error('Impossible de supprimer la partie locale');
        }
      } else {
        const result = await cloudSave.deleteFromCloud(gameId);
        if (!result.success) {
          throw new Error(result.error || 'Impossible de supprimer la partie cloud');
        }
      }

      // Retirer de la liste locale
      games.value = games.value.filter(g => g.id !== gameId);

      return { success: true };
    } catch (err) {
      console.error('Delete game error:', err);
      error.value = err.message || 'Erreur lors de la suppression';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Obtenir uniquement les parties locales
   */
  function getLocalGames() {
    return games.value.filter(g => g.source === 'local');
  }

  /**
   * Obtenir uniquement les parties cloud
   */
  function getCloudGames() {
    return games.value.filter(g => g.source === 'cloud');
  }

  /**
   * Migrer une partie locale vers le cloud
   * @param {string} localGameId - ID de la partie locale
   * @param {boolean} [deleteAfter=false] - Supprimer la copie locale après migration
   */
  async function migrateToCloud(localGameId, deleteAfter = false) {
    if (storageMode.value !== 'cloud') {
      return { success: false, error: 'Connectez-vous pour migrer vers le cloud' };
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Charger la partie locale
      const localGame = loadLocalGame(localGameId);
      if (!localGame) {
        throw new Error('Partie locale introuvable');
      }

      // Sauvegarder dans le cloud
      const cloudResult = await cloudSave.saveToCloud(
        localGame.meta.name || 'Partie migrée',
        localGame.state
      );

      if (!cloudResult.success) {
        throw new Error(cloudResult.error || 'Échec de la migration');
      }

      // Supprimer la copie locale si demandé
      if (deleteAfter) {
        deleteLocalGame(localGameId);
      }

      await fetchGames();

      return {
        success: true,
        cloudGame: cloudResult.game,
        localDeleted: deleteAfter
      };
    } catch (err) {
      console.error('Migration error:', err);
      error.value = err.message || 'Erreur lors de la migration';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Migrer toutes les parties locales vers le cloud
   */
  async function migrateAllToCloud(deleteAfter = false) {
    const localGames = getLocalGames();
    const results = [];

    for (const game of localGames) {
      const result = await migrateToCloud(game.id, deleteAfter);
      results.push({
        localId: game.id,
        name: game.name,
        ...result
      });
    }

    return results;
  }

  /**
   * Effacer l'erreur
   */
  function clearError() {
    error.value = null;
  }

  // Computed helpers
  const hasGames = computed(() => games.value.length > 0);
  const hasLocalGames = computed(() => games.value.some(g => g.source === 'local'));
  const hasCloudGames = computed(() => games.value.some(g => g.source === 'cloud'));
  const canUseCloud = computed(() => storageMode.value === 'cloud');

  // Rafraîchir la liste quand l'état d'auth change
  watch(isAuthenticated, () => {
    fetchGames();
  });

  return {
    // État
    games,
    isLoading,
    error,
    storageMode,

    // Computed
    hasGames,
    hasLocalGames,
    hasCloudGames,
    canUseCloud,

    // Actions principales
    fetchGames,
    saveGame,
    loadGame,
    deleteGame,

    // Helpers
    getLocalGames,
    getCloudGames,
    clearError,

    // Migration
    migrateToCloud,
    migrateAllToCloud
  };
}
