<template>
  <div class="cloud-save-list">
    <!-- Header avec refresh -->
    <div class="list-header">
      <span class="list-count" v-if="!isLoading && games.length > 0">
        {{ games.length }} partie{{ games.length > 1 ? 's' : '' }}
      </span>
      <button
        type="button"
        class="btn-refresh"
        @click="handleRefresh"
        :disabled="isLoading"
        title="Actualiser"
      >
        <UIIcon type="restart" size="sm" :class="{ spinning: isLoading }" />
      </button>
    </div>

    <!-- État de chargement -->
    <div v-if="isLoading && games.length === 0" class="list-state list-state--loading">
      <div class="spinner"></div>
      <span>Chargement des parties...</span>
    </div>

    <!-- État vide -->
    <div v-else-if="!isLoading && games.length === 0" class="list-state list-state--empty">
      <UIIcon type="save" class="empty-icon" />
      <p class="empty-text">Aucune partie sauvegardée</p>
      <p class="empty-hint">Vos parties cloud apparaîtront ici</p>
    </div>

    <!-- État d'erreur -->
    <div v-else-if="error" class="list-state list-state--error">
      <UIIcon type="warning" class="error-icon" />
      <p class="error-text">{{ error }}</p>
      <button type="button" class="btn-retry" @click="handleRefresh">
        Réessayer
      </button>
    </div>

    <!-- Liste des parties -->
    <div v-else class="games-grid">
      <CloudSaveCard
        v-for="game in games"
        :key="game.id"
        :game="game"
        :is-loading="loadingGameId === game.id"
        @load="handleLoad"
        @delete="confirmDelete"
      />
    </div>

    <!-- Modal de confirmation de suppression -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="gameToDelete" class="confirm-overlay" @click.self="cancelDelete">
          <div class="confirm-dialog">
            <h3 class="confirm-title">Supprimer cette partie ?</h3>
            <p class="confirm-message">
              La partie <strong>{{ gameToDelete.name }}</strong> sera définitivement supprimée.
            </p>
            <div class="confirm-actions">
              <button type="button" class="btn btn-secondary" @click="cancelDelete">
                Annuler
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="executeDelete"
                :disabled="isDeleting"
              >
                {{ isDeleting ? 'Suppression...' : 'Supprimer' }}
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
import UIIcon from './icons/UIIcon.vue';
import CloudSaveCard from './CloudSaveCard.vue';
import { useCloudSave } from '../composables/useCloudSave.js';

const emit = defineEmits(['load']);

const {
  cloudGames: games,
  isLoading,
  error,
  isDeleting,
  fetchGames,
  loadFromCloud,
  deleteFromCloud
} = useCloudSave();

const loadingGameId = ref(null);
const gameToDelete = ref(null);

onMounted(() => {
  fetchGames();
});

function handleRefresh() {
  fetchGames();
}

async function handleLoad(game) {
  loadingGameId.value = game.id;

  const result = await loadFromCloud(game.id);

  loadingGameId.value = null;

  if (result.success) {
    emit('load', {
      meta: result.meta,
      state: result.state
    });
  }
}

function confirmDelete(game) {
  gameToDelete.value = game;
}

function cancelDelete() {
  gameToDelete.value = null;
}

async function executeDelete() {
  if (!gameToDelete.value) return;

  const gameId = gameToDelete.value.id;
  const result = await deleteFromCloud(gameId);

  if (result.success) {
    gameToDelete.value = null;
  }
}
</script>

<style scoped>
.cloud-save-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-count {
  font-size: 13px;
  color: var(--color-ink-muted);
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  color: var(--color-ink-muted);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-refresh:hover:not(:disabled) {
  background: var(--color-canvas);
  color: var(--color-ink);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-refresh :deep(svg) {
  width: 16px;
  height: 16px;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* États */
.list-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-lg);
  text-align: center;
  background: var(--color-canvas);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
}

.list-state--loading {
  gap: var(--space-md);
  color: var(--color-ink-muted);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-line);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.list-state--empty {
  gap: var(--space-sm);
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: var(--color-ink-subtle);
}

.empty-text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-ink-muted);
}

.list-state--error {
  gap: var(--space-sm);
  border-color: var(--color-danger);
  background: rgba(220, 38, 38, 0.04);
}

.error-icon {
  width: 32px;
  height: 32px;
  color: var(--color-danger);
}

.error-text {
  margin: 0;
  font-size: 14px;
  color: var(--color-danger);
}

.btn-retry {
  margin-top: var(--space-sm);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  color: var(--color-ink);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-canvas);
}

/* Grille des parties */
.games-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Confirmation dialog */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 24, 0.75);
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-lg);
}

.confirm-dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  max-width: 360px;
  width: 100%;
  box-shadow: 0 18px 48px rgba(31, 35, 40, 0.25);
}

.confirm-title {
  margin: 0 0 var(--space-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
}

.confirm-message {
  margin: 0 0 var(--space-lg);
  font-size: 14px;
  color: var(--color-ink-soft);
  line-height: 1.5;
}

.confirm-message strong {
  color: var(--color-ink);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  color: var(--color-ink);
}

.btn-secondary:hover {
  background: var(--color-canvas);
}

.btn-danger {
  background: var(--color-danger);
  border: 1px solid var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
