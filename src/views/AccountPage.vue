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
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats.totalGames }}</span>
            <span class="stat-label">Parties sauvegardées</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.cloudGames }}</span>
            <span class="stat-label">Dans le cloud</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.localGames }}</span>
            <span class="stat-label">En local</span>
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
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth.js';
import { useStorage } from '../composables/useStorage.js';
import UIIcon from '../components/icons/UIIcon.vue';

const emit = defineEmits(['back', 'load']);

const { user, profile } = useAuth();
const { games, isLoading, fetchGames, deleteGame } = useStorage();

const gameToDelete = ref(null);
const deletingId = ref(null);

const stats = computed(() => ({
  totalGames: games.value.length,
  cloudGames: games.value.filter(g => g.source === 'cloud').length,
  localGames: games.value.filter(g => g.source === 'local').length
}));

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

onMounted(() => {
  fetchGames();
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

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

.stat-card {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-value {
  font-family: var(--font-mono, monospace);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-ink);
}

.stat-label {
  font-size: 11px;
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }

  .stat-value {
    font-size: 20px;
    order: 2;
  }

  .stat-label {
    order: 1;
  }
}
</style>
