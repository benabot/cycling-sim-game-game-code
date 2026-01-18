<template>
  <div class="account-page">
    <header class="account-header">
      <button type="button" class="btn btn-ghost" @click="goBack">
        <UIIcon type="chevron-left" size="sm" />
        Retour
      </button>
      <h1 class="account-title">Mon compte</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="account-content">
      <!-- Section Profil -->
      <section class="account-section">
        <h2 class="section-title">
          <UIIcon type="human" size="md" />
          Profil
        </h2>
        <div class="profile-card">
          <div class="profile-field">
            <span class="profile-label">Nom d'utilisateur</span>
            <span class="profile-value">{{ profile?.username || '-' }}</span>
          </div>
          <div class="profile-field">
            <span class="profile-label">Email</span>
            <span class="profile-value">{{ user?.email || '-' }}</span>
          </div>
          <div class="profile-field">
            <span class="profile-label">Membre depuis</span>
            <span class="profile-value">{{ formatDate(profile?.created_at) }}</span>
          </div>
        </div>
      </section>

      <!-- Section Statistiques -->
      <section class="account-section">
        <h2 class="section-title">
          <UIIcon type="trophy" size="md" />
          Statistiques
        </h2>
        <div class="stats-block">
          <div class="stats-block__header">
            <span class="stats-block__title">Parties terminées</span>
            <span v-if="!statsLoading && !statsError" class="stats-block__count">
              {{ finishedGames.length }}
            </span>
          </div>

          <div v-if="statsLoading" class="stats-state">
            Chargement...
          </div>
          <div v-else-if="statsError" class="stats-state stats-state--error">
            {{ statsError }}
          </div>
          <div v-else-if="finishedGames.length === 0" class="stats-state">
            Aucune partie terminée pour le moment.
          </div>
          <div v-else class="stats-list">
            <div v-for="game in finishedGames" :key="game.id" class="stats-card">
              <div class="stats-card__top">
                <span class="stats-card__title">{{ game.name }}</span>
                <span class="stats-card__date">{{ formatDate(game.finishedAt) }}</span>
              </div>
              <div class="stats-card__meta">
                <span class="stats-card__item">Parcours: {{ game.raceLabel }}</span>
                <span class="stats-card__item">Classement: {{ formatRanking(game) }}</span>
                <span class="stats-card__item">Tours: {{ game.currentTurn || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section Mes parties -->
      <section class="account-section">
        <h2 class="section-title">
          <UIIcon type="save" size="md" />
          Mes parties sauvegardées
        </h2>

        <div v-if="isLoading" class="loading-state">
          <span class="spinner"></span>
          Chargement...
        </div>

        <div v-else-if="games.length === 0" class="empty-state">
          <UIIcon type="save" size="xl" />
          <p>Aucune partie sauvegardée</p>
        </div>

        <div v-else class="games-list">
          <div
            v-for="game in games"
            :key="game.id"
            class="game-card"
          >
            <div class="game-header">
              <div class="game-info">
                <span class="game-name">{{ game.name }}</span>
                <span class="game-badge" :class="'game-badge--' + game.source">
                  {{ game.source === 'cloud' ? 'Cloud' : 'Local' }}
                </span>
              </div>
              <span class="game-date">{{ formatRelativeDate(game.updatedAt) }}</span>
            </div>

            <div class="game-details">
              <span class="game-detail">
                <UIIcon :type="getRaceIcon(game)" size="xs" />
                {{ getRaceName(game) }}
              </span>
              <span class="game-detail">
                Tour {{ game.currentTurn }}
              </span>
              <span v-if="game.leader" class="game-detail">
                Leader: {{ game.leader.name }}
              </span>
            </div>

            <div class="game-actions">
              <button
                type="button"
                class="btn btn-danger-ghost btn-sm"
                @click="confirmDelete(game)"
                :disabled="deletingId === game.id"
              >
                <UIIcon type="close" size="sm" />
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="handleLoad(game)"
              >
                <UIIcon type="play" size="sm" />
                Charger
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Confirmation de suppression -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="gameToDelete" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-dialog">
            <h3 class="modal-title">Supprimer cette partie ?</h3>
            <p class="modal-text">
              « {{ gameToDelete.name }} » sera définitivement supprimée.
            </p>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="cancelDelete">
                Annuler
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="executeDelete"
                :disabled="deletingId"
              >
                <template v-if="deletingId">
                  <span class="spinner-small"></span>
                  Suppression...
                </template>
                <template v-else>
                  Supprimer
                </template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase.js';
import { listLocalGames } from '../core/save-manager.js';
import { useAuth } from '../composables/useAuth.js';
import { useStorage } from '../composables/useStorage.js';
import UIIcon from '../components/icons/UIIcon.vue';

const emit = defineEmits(['back', 'load']);

const { user, profile } = useAuth();
const { games, isLoading, fetchGames, deleteGame } = useStorage();

const gameToDelete = ref(null);
const deletingId = ref(null);
const finishedGames = ref([]);
const statsLoading = ref(false);
const statsError = ref('');

function formatDate(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

function formatRelativeDate(date) {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;

    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function getRaceName(game) {
  if (game.raceMode === 'stage') return 'Course à étapes';
  if (game.racePreset) {
    const names = {
      ardennaise: 'Ardennaise',
      lombarde: 'Lombarde',
      riviera: 'Riviera',
      nord: 'Nord'
    };
    return names[game.racePreset] || game.racePreset;
  }
  return 'Course';
}

function getRaceIcon(game) {
  return game.raceMode === 'stage' ? 'calendar' : 'laurel';
}

const racePresetLabels = {
  ardennaise: 'Ardennaise',
  lombarde: 'Lombarde',
  riviera: 'Riviera',
  nord: 'Nord'
};

function getRaceLabel({ raceMode, racePreset, raceName }) {
  if (raceName) return raceName;

  const normalizedMode = String(raceMode || '').toLowerCase();
  if (normalizedMode === 'stage') return 'Course à étapes';

  if (racePreset) return racePresetLabels[racePreset] || racePreset;

  return 'Course';
}

function normalizeFinishedLocalGame(localGame) {
  const meta = localGame.meta || {};
  const state = localGame.state || {};

  return {
    id: localGame.id,
    source: 'local',
    name: meta.name || 'Sans nom',
    finishedAt: meta.savedAt || null,
    raceLabel: getRaceLabel({
      raceMode: meta.raceMode,
      racePreset: null,
      raceName: meta.raceName
    }),
    currentTurn: meta.currentTurn || null,
    rankings: Array.isArray(state.rankings) ? state.rankings : []
  };
}

function normalizeFinishedCloudGame(cloudGame) {
  return {
    id: cloudGame.id,
    source: 'cloud',
    name: cloudGame.name || 'Sans nom',
    finishedAt: cloudGame.updated_at || cloudGame.created_at || null,
    raceLabel: getRaceLabel({
      raceMode: cloudGame.race_mode,
      racePreset: cloudGame.race_preset,
      raceName: null
    }),
    currentTurn: cloudGame.current_turn || null,
    rankings: Array.isArray(cloudGame.state?.rankings) ? cloudGame.state.rankings : []
  };
}

function formatRanking(game) {
  const topRider = Array.isArray(game.rankings) ? game.rankings[0] : null;
  if (topRider?.name) return `1er: ${topRider.name}`;
  return '—';
}

async function fetchFinishedGames() {
  statsLoading.value = true;
  statsError.value = '';

  const finished = [];
  let cloudError = null;

  try {
    const localFinished = listLocalGames()
      .filter(game => String(game.meta?.phase || '').toLowerCase() === 'finished')
      .map(normalizeFinishedLocalGame);
    finished.push(...localFinished);

    if (supabase && user.value) {
      const { data, error } = await supabase
        .from('games')
        .select('id,name,updated_at,created_at,race_mode,race_preset,current_turn,phase,state')
        .eq('owner_id', user.value.id)
        .eq('phase', 'finished')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        cloudError = error;
      } else {
        finished.push(...(data || []).map(normalizeFinishedCloudGame));
      }
    }

    finished.sort((a, b) => new Date(b.finishedAt || 0) - new Date(a.finishedAt || 0));
    finishedGames.value = finished.slice(0, 20);

    if (!finishedGames.value.length && cloudError) {
      statsError.value = 'Impossible de charger les statistiques.';
    }
  } catch (err) {
    console.error('Fetch finished games error:', err);
    statsError.value = 'Impossible de charger les statistiques.';
    finishedGames.value = [];
  } finally {
    statsLoading.value = false;
  }
}

function goBack() {
  emit('back');
}

function handleLoad(game) {
  emit('load', game);
}

function confirmDelete(game) {
  gameToDelete.value = game;
}

function cancelDelete() {
  gameToDelete.value = null;
}

async function executeDelete() {
  if (!gameToDelete.value) return;

  deletingId.value = gameToDelete.value.id;

  const result = await deleteGame(gameToDelete.value.id);

  deletingId.value = null;

  if (result.success) {
    gameToDelete.value = null;
  }
}

onMounted(async () => {
  await fetchGames();
  fetchFinishedGames();
});
</script>

<style scoped>
.account-page {
  min-height: 100vh;
  background: var(--color-canvas);
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-line);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky, 200);
}

.account-title {
  font-family: var(--font-display, inherit);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.header-spacer {
  width: 80px;
}

.account-content {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Sections */
.account-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.section-title :deep(svg) {
  color: var(--color-ink-muted);
}

/* Profile card */
.profile-card {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.profile-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) 0;
}

.profile-label {
  font-size: 13px;
  color: var(--color-ink-muted);
}

.profile-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
}

/* Stats block */
.stats-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.stats-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.stats-block__title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-ink-muted);
  font-weight: 600;
}

.stats-block__count {
  font-size: 12px;
  color: var(--color-ink-soft);
}

.stats-state {
  font-size: 14px;
  color: var(--color-ink-muted);
  padding: var(--space-sm) 0;
}

.stats-state--error {
  color: var(--color-danger, #dc2626);
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.stats-card {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stats-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.stats-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.stats-card__date {
  font-size: 12px;
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.stats-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
  font-size: 12px;
  color: var(--color-ink-soft);
}

.stats-card__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Loading & empty states */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  color: var(--color-ink-muted);
  font-size: 14px;
}

.empty-state :deep(svg) {
  opacity: 0.3;
}

/* Games list */
.games-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.game-card {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  transition: var(--transition-fast);
}

.game-card:hover {
  border-color: var(--color-line-strong);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.game-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.game-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.game-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.game-badge--cloud {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.game-badge--local {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.game-date {
  font-size: 12px;
  color: var(--color-ink-muted);
}

.game-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  font-size: 12px;
  color: var(--color-ink-soft);
}

.game-detail {
  display: flex;
  align-items: center;
  gap: 4px;
}

.game-detail :deep(svg) {
  color: var(--color-ink-muted);
}

.game-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-line-subtle);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  font-family: var(--font-body, inherit);
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-ink-soft);
}

.btn-ghost:hover {
  background: var(--color-canvas);
  color: var(--color-ink);
}

.btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  color: var(--color-ink);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-canvas);
  border-color: var(--color-line-strong);
}

.btn-primary {
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  color: var(--color-paper);
}

.btn-primary:hover:not(:disabled) {
  background: #2d3339;
}

.btn-danger-ghost {
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-ink-muted);
}

.btn-danger-ghost:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.08);
  border-color: var(--color-danger, #dc2626);
  color: var(--color-danger, #dc2626);
}

.btn-danger {
  background: var(--color-danger, #dc2626);
  border: 1px solid var(--color-danger, #dc2626);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn :deep(svg) {
  width: 14px;
  height: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 400);
  padding: var(--space-md);
}

.modal-dialog {
  background: var(--color-paper);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 var(--space-sm);
}

.modal-text {
  font-size: 14px;
  color: var(--color-ink-soft);
  margin: 0 0 var(--space-lg);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-line);
  border-top-color: var(--color-ink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile */
@media (max-width: 720px) {
  .account-header {
    padding: var(--space-sm) var(--space-md);
  }

  .account-content {
    padding: var(--space-md);
  }

  .stats-card__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-card__date {
    white-space: normal;
  }
}
</style>
