/**
 * Games Service - CRUD cloud pour les parties sauvegardées
 * @module services/games.service
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Erreur du service games
 */
export class GamesServiceError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message);
    this.name = 'GamesServiceError';
    this.code = code;
  }
}

export const GamesErrorCode = {
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

/**
 * Vérifie les prérequis (Supabase configuré + utilisateur connecté)
 * @returns {Promise<string>} User ID
 * @throws {GamesServiceError}
 */
async function requireAuth() {
  if (!isSupabaseConfigured()) {
    throw new GamesServiceError('Supabase non configuré', GamesErrorCode.NOT_CONFIGURED);
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new GamesServiceError('Utilisateur non connecté', GamesErrorCode.NOT_AUTHENTICATED);
  }

  return user.id;
}

/**
 * Extraire les métadonnées d'un game state pour la colonne state
 * @param {Object} gameState - État complet du jeu
 * @returns {Object} Métadonnées pour la DB
 */
function extractGameMeta(gameState) {
  // Trouver le leader (coureur le plus avancé non arrivé)
  const leader = gameState.riders?.reduce((best, rider) => {
    if (!rider.hasFinished && rider.position > (best?.position || 0)) {
      return rider;
    }
    return best;
  }, null);

  // Déterminer le mode de course
  let raceMode = 'classic';
  let racePreset = null;

  if (gameState.stageRace) {
    raceMode = 'stage';
  }
  if (gameState.gameConfig?.classicId) {
    racePreset = gameState.gameConfig.classicId;
  }

  return {
    race_mode: raceMode,
    race_preset: racePreset,
    course_length: gameState.courseLength || 80,
    current_turn: gameState.currentTurn || 1,
    phase: gameState.phase || 'playing',
    leader_name: leader?.name || null,
    leader_team: leader?.team || null,
    leader_position: leader?.position || 0
  };
}

/**
 * Créer une nouvelle partie cloud
 * @param {Object} params
 * @param {string} params.name - Nom de la partie
 * @param {Object} params.gameState - État complet du jeu
 * @returns {Promise<Object>} Partie créée
 */
export async function createGame({ name, gameState }) {
  const userId = await requireAuth();

  if (!name || !gameState) {
    throw new GamesServiceError('Nom et état du jeu requis', GamesErrorCode.VALIDATION_ERROR);
  }

  const meta = extractGameMeta(gameState);

  const { data, error } = await supabase
    .from('games')
    .insert({
      owner_id: userId,
      name: name.trim(),
      ...meta,
      state: gameState,
      is_multiplayer: false
    })
    .select()
    .single();

  if (error) {
    console.error('Create game error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new GamesServiceError(
      error.message || 'Impossible de créer la partie',
      GamesErrorCode.NETWORK_ERROR
    );
  }

  return data;
}

/**
 * Mettre à jour une partie existante
 * @param {string} gameId - ID de la partie
 * @param {Object} params
 * @param {string} [params.name] - Nouveau nom (optionnel)
 * @param {Object} params.gameState - Nouvel état du jeu
 * @returns {Promise<Object>} Partie mise à jour
 */
export async function updateGame(gameId, { name, gameState }) {
  await requireAuth();

  if (!gameState) {
    throw new GamesServiceError('État du jeu requis', GamesErrorCode.VALIDATION_ERROR);
  }

  const meta = extractGameMeta(gameState);
  const updateData = {
    ...meta,
    state: gameState,
    updated_at: new Date().toISOString()
  };

  if (name) {
    updateData.name = name.trim();
  }

  const { data, error } = await supabase
    .from('games')
    .update(updateData)
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new GamesServiceError('Partie introuvable', GamesErrorCode.NOT_FOUND);
    }
    console.error('Update game error:', error);
    throw new GamesServiceError(
      'Impossible de mettre à jour la partie',
      GamesErrorCode.NETWORK_ERROR
    );
  }

  return data;
}

/**
 * Récupérer une partie par ID
 * @param {string} gameId - ID de la partie
 * @returns {Promise<Object>} Partie avec son état
 */
export async function getGame(gameId) {
  await requireAuth();

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new GamesServiceError('Partie introuvable', GamesErrorCode.NOT_FOUND);
    }
    console.error('Get game error:', error);
    throw new GamesServiceError(
      'Impossible de récupérer la partie',
      GamesErrorCode.NETWORK_ERROR
    );
  }

  return data;
}

/**
 * Lister les parties de l'utilisateur
 * @param {Object} options
 * @param {number} [options.limit=20] - Nombre max de résultats
 * @param {number} [options.offset=0] - Décalage pour pagination
 * @param {string} [options.orderBy='updated_at'] - Colonne de tri
 * @param {boolean} [options.ascending=false] - Tri ascendant
 * @returns {Promise<{games: Array, count: number}>}
 */
export async function listUserGames(options = {}) {
  const userId = await requireAuth();

  const {
    limit = 20,
    offset = 0,
    orderBy = 'updated_at',
    ascending = false
  } = options;

  const { data, error, count } = await supabase
    .from('games')
    .select('*', { count: 'exact' })
    .eq('owner_id', userId)
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('List games error:', error);
    throw new GamesServiceError(
      'Impossible de récupérer les parties',
      GamesErrorCode.NETWORK_ERROR
    );
  }

  return {
    games: data || [],
    count: count || 0
  };
}

/**
 * Supprimer une partie
 * @param {string} gameId - ID de la partie
 * @returns {Promise<void>}
 */
export async function deleteGame(gameId) {
  await requireAuth();

  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId);

  if (error) {
    console.error('Delete game error:', error);
    throw new GamesServiceError(
      'Impossible de supprimer la partie',
      GamesErrorCode.NETWORK_ERROR
    );
  }
}

/**
 * Dupliquer une partie existante
 * @param {string} gameId - ID de la partie à dupliquer
 * @param {string} newName - Nom de la copie
 * @returns {Promise<Object>} Nouvelle partie
 */
export async function duplicateGame(gameId, newName) {
  const original = await getGame(gameId);

  return createGame({
    name: newName,
    gameState: original.state
  });
}
