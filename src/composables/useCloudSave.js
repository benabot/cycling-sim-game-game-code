/**
 * Composable pour la gestion des sauvegardes cloud
 * @module composables/useCloudSave
 */

import { ref, computed } from 'vue';
import { useAuth } from './useAuth.js';
import {
  createGame,
  updateGame,
  getGame,
  listUserGames,
  deleteGame,
  GamesServiceError,
  GamesErrorCode
} from '../services/games.service.js';
import { serializeSave } from '../core/save-manager.js';

// État partagé entre les instances
const cloudGames = ref([]);
const totalCount = ref(0);
const isLoading = ref(false);
const error = ref(null);
const lastFetchTime = ref(null);

/**
 * Hook pour gérer les sauvegardes cloud
 * @returns {Object} API de sauvegarde cloud
 */
export function useCloudSave() {
  const { isAuthenticated, isConfigured } = useAuth();

  // État local pour les opérations en cours
  const isSaving = ref(false);
  const isDeleting = ref(false);

  /**
   * Récupérer la liste des parties de l'utilisateur
   * @param {Object} options - Options de pagination/tri
   */
  async function fetchGames(options = {}) {
    if (!isAuthenticated.value) {
      cloudGames.value = [];
      totalCount.value = 0;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await listUserGames(options);
      cloudGames.value = result.games;
      totalCount.value = result.count;
      lastFetchTime.value = new Date();
    } catch (err) {
      console.error('Fetch games error:', err);
      error.value = formatError(err);
      cloudGames.value = [];
      totalCount.value = 0;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sauvegarder une partie dans le cloud
   * @param {string} name - Nom de la sauvegarde
   * @param {Object} gameState - État du jeu (depuis useGameEngine)
   * @param {string} [existingGameId] - ID d'une partie existante à mettre à jour
   * @returns {Promise<{success: boolean, game?: Object, error?: string}>}
   */
  async function saveToCloud(name, gameState, existingGameId = null) {
    if (!isAuthenticated.value) {
      return { success: false, error: 'Connectez-vous pour sauvegarder dans le cloud' };
    }

    isSaving.value = true;
    error.value = null;

    try {
      // Nettoyer l'état pour la sérialisation (réutilise la logique existante)
      const { state: cleanState } = serializeSave(gameState, name);

      let game;
      if (existingGameId) {
        game = await updateGame(existingGameId, { name, gameState: cleanState });
      } else {
        game = await createGame({ name, gameState: cleanState });
      }

      // Rafraîchir la liste
      await fetchGames();

      return { success: true, game };
    } catch (err) {
      console.error('Save to cloud error:', err);
      const errorMessage = formatError(err);
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Charger une partie depuis le cloud
   * @param {string} gameId - ID de la partie
   * @returns {Promise<{success: boolean, meta?: Object, state?: Object, error?: string}>}
   */
  async function loadFromCloud(gameId) {
    if (!isAuthenticated.value) {
      return { success: false, error: 'Connectez-vous pour accéder à vos parties' };
    }

    isLoading.value = true;
    error.value = null;

    try {
      const game = await getGame(gameId);

      // Construire les métadonnées pour l'aperçu (format compatible avec SavePreview)
      const meta = {
        name: game.name,
        savedAt: game.updated_at || game.created_at,
        raceMode: game.race_mode?.toUpperCase() || 'CLASSIC',
        raceName: formatRaceName(game),
        courseLength: game.course_length,
        currentTurn: game.current_turn,
        phase: game.phase,
        leaderName: game.leader_name,
        leaderPosition: game.leader_position,
        leaderTeam: game.leader_team,
        // Données supplémentaires cloud
        cloudGameId: game.id,
        isCloud: true
      };

      return {
        success: true,
        meta,
        state: game.state,
        game
      };
    } catch (err) {
      console.error('Load from cloud error:', err);
      const errorMessage = formatError(err);
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Supprimer une partie du cloud
   * @param {string} gameId - ID de la partie
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function deleteFromCloud(gameId) {
    if (!isAuthenticated.value) {
      return { success: false, error: 'Connectez-vous pour gérer vos parties' };
    }

    isDeleting.value = true;
    error.value = null;

    try {
      await deleteGame(gameId);

      // Retirer de la liste locale
      cloudGames.value = cloudGames.value.filter(g => g.id !== gameId);
      totalCount.value = Math.max(0, totalCount.value - 1);

      return { success: true };
    } catch (err) {
      console.error('Delete from cloud error:', err);
      const errorMessage = formatError(err);
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Rafraîchir la liste des parties
   */
  async function refreshList() {
    await fetchGames();
  }

  /**
   * Effacer l'erreur
   */
  function clearError() {
    error.value = null;
  }

  // Computed
  const hasGames = computed(() => cloudGames.value.length > 0);
  const canUseCloud = computed(() => isConfigured.value && isAuthenticated.value);

  return {
    // État partagé
    cloudGames,
    totalCount,
    isLoading,
    error,
    lastFetchTime,

    // État local
    isSaving,
    isDeleting,

    // Computed
    hasGames,
    canUseCloud,

    // Actions
    fetchGames,
    saveToCloud,
    loadFromCloud,
    deleteFromCloud,
    refreshList,
    clearError
  };
}

// ============================================
// Helpers
// ============================================

/**
 * Formater une erreur pour l'affichage
 */
function formatError(err) {
  // Détecter les erreurs de blocage réseau (content blocker, etc.)
  if (err.name === 'AbortError' || err.message?.includes('aborted')) {
    return 'Requête aborted - bloqueur de contenu actif ?';
  }

  if (err instanceof GamesServiceError) {
    switch (err.code) {
      case GamesErrorCode.NOT_CONFIGURED:
        return 'Service cloud non disponible';
      case GamesErrorCode.NOT_AUTHENTICATED:
        return 'Connectez-vous pour accéder au cloud';
      case GamesErrorCode.NOT_FOUND:
        return 'Partie introuvable';
      case GamesErrorCode.PERMISSION_DENIED:
        return 'Accès non autorisé';
      case GamesErrorCode.VALIDATION_ERROR:
        return err.message;
      default:
        return 'Erreur de connexion au serveur';
    }
  }

  return err.message || 'Une erreur est survenue';
}

/**
 * Formater le nom de la course pour l'affichage
 */
function formatRaceName(game) {
  if (game.race_mode === 'stage') {
    return 'Course à étapes';
  }

  if (game.race_preset) {
    const presetNames = {
      ardennaise: 'Ardennaise',
      lombarde: 'Lombarde',
      riviera: 'Riviera',
      nord: 'Nord'
    };
    return presetNames[game.race_preset] || game.race_preset;
  }

  return 'Course personnalisée';
}
