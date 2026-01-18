<template>
  <ModalShell
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Charger une partie"
    max-width="560px"
  >
    <div class="load-content">
      <!-- Header avec actions -->
      <div class="load-header">
        <div class="storage-indicator">
          <span class="storage-mode" :class="`storage-mode--${storageMode}`">
            <UIIcon :type="storageMode === 'cloud' ? 'save' : 'download'" size="sm" />
            {{ storageMode === 'cloud' ? 'Cloud actif' : 'Local uniquement' }}
          </span>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="showFileImport = !showFileImport"
            title="Importer un fichier .csg"
          >
            <UIIcon type="upload" size="sm" />
            Importer
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="handleRefresh"
            :disabled="isLoading"
            title="Actualiser"
          >
            <UIIcon type="restart" size="sm" :class="{ spinning: isLoading }" />
          </button>
        </div>
      </div>

      <!-- Zone d'import de fichier (collapsible) -->
      <Transition name="slide">
        <div v-if="showFileImport" class="file-import-zone">
          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragging, 'drop-zone--error': fileError }"
            @dragenter.prevent="isDragging = true"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <label class="drop-zone-label">
              <input
                ref="fileInput"
                type="file"
                accept=".csg,.json"
                class="file-input"
                @change="handleFileSelect"
              />
            </label>
            <UIIcon type="upload" class="drop-icon" />
            <p class="drop-text">
              Glissez un fichier .csg ici<br>
              <span class="drop-hint">ou cliquez pour parcourir</span>
            </p>
          </div>
          <div v-if="fileError" class="error-message error-message--sm">
            <UIIcon type="warning" />
            <span>{{ fileError }}</span>
          </div>
          <div v-if="importedGame" class="imported-preview">
            <SavePreview :meta="importedGame.meta" />
            <button type="button" class="btn btn-primary btn-sm" @click="loadImported">
              <UIIcon type="play" size="sm" />
              Charger
            </button>
          </div>
        </div>
      </Transition>

      <!-- Message d'erreur global -->
      <div v-if="error" class="error-message">
        <UIIcon type="warning" />
        <span>{{ error }}</span>
      </div>

      <!-- Liste des parties -->
      <div class="games-section">
        <!-- État de chargement -->
        <div v-if="isLoading && games.length === 0" class="list-state list-state--loading">
          <div class="spinner"></div>
          <span>Chargement...</span>
        </div>

        <!-- Liste vide -->
        <div v-else-if="!isLoading && games.length === 0" class="list-state list-state--empty">
          <UIIcon type="save" class="empty-icon" />
          <p class="empty-text">Aucune partie sauvegardée</p>
          <p class="empty-hint">Sauvegardez une partie pour la retrouver ici</p>
        </div>

        <!-- Liste des parties -->
        <div v-else class="games-list">
          <div
            v-for="game in games"
            :key="game.id"
            class="game-card"
            :class="{ 'game-card--loading': loadingGameId === game.id }"
          >
            <div class="game-header">
              <span class="game-badge" :class="`game-badge--${game.source}`">
                {{ game.source === 'cloud' ? 'Cloud' : 'Local' }}
              </span>
              <span class="game-name">{{ game.name }}</span>
            </div>

            <div class="game-details">
              <div class="game-row">
                <span class="game-label">Parcours</span>
                <span class="game-value">{{ game.racePreset || 'Personnalisé' }} ({{ game.courseLength }})</span>
              </div>
              <div class="game-row">
                <span class="game-label">Tour</span>
                <span class="game-value">{{ game.currentTurn }}</span>
              </div>
              <div v-if="game.leader" class="game-row">
                <span class="game-label">Leader</span>
                <span class="game-value">{{ game.leader.name }}</span>
              </div>
              <div class="game-row game-row--muted">
                <span class="game-label">Modifié</span>
                <span class="game-value">{{ formatDate(game.updatedAt) }}</span>
              </div>
            </div>

            <div class="game-actions">
              <!-- Migration vers cloud -->
              <button
                v-if="game.source === 'local' && canUseCloud"
                type="button"
                class="btn btn-ghost btn-xs"
                @click="handleMigrate(game)"
                :disabled="loadingGameId === game.id"
                title="Migrer vers le cloud"
              >
                <UIIcon type="upload" size="xs" />
              </button>
              <!-- Supprimer -->
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                @click="confirmDelete(game)"
                :disabled="loadingGameId === game.id"
                title="Supprimer"
              >
                <UIIcon type="close" size="xs" />
              </button>
              <!-- Charger -->
              <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="handleLoad(game)"
                :disabled="loadingGameId === game.id"
              >
                <UIIcon type="play" size="sm" />
                Charger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation suppression -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="gameToDelete" class="confirm-overlay" @click.self="gameToDelete = null">
          <div class="confirm-dialog">
            <h3 class="confirm-title">Supprimer cette partie ?</h3>
            <p class="confirm-message">
              La partie <strong>{{ gameToDelete.name }}</strong> sera définitivement supprimée.
            </p>
            <div class="confirm-actions">
              <button type="button" class="btn btn-secondary" @click="gameToDelete = null">
                Annuler
              </button>
              <button type="button" class="btn btn-danger" @click="executeDelete" :disabled="isDeleting">
                {{ isDeleting ? 'Suppression...' : 'Supprimer' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <template #footer>
      <div class="load-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('update:modelValue', false)">
          Fermer
        </button>
      </div>
    </template>
  </ModalShell>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import ModalShell from './ModalShell.vue';
import SavePreview from './SavePreview.vue';
import UIIcon from './icons/UIIcon.vue';
import { useStorage } from '../composables/useStorage.js';
import { readSaveFile } from '../core/save-manager.js';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'load']);

const {
  games,
  isLoading,
  error,
  storageMode,
  canUseCloud,
  fetchGames,
  loadGame,
  deleteGame,
  migrateToCloud
} = useStorage();

// File import state
const showFileImport = ref(false);
const fileInput = ref(null);
const isDragging = ref(false);
const fileError = ref(null);
const importedGame = ref(null);

// Actions state
const loadingGameId = ref(null);
const gameToDelete = ref(null);
const isDeleting = ref(false);

// Charger les parties à l'ouverture
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    fetchGames();
    resetFileImport();
  }
});

onMounted(() => {
  if (props.modelValue) {
    fetchGames();
  }
});

function resetFileImport() {
  showFileImport.value = false;
  isDragging.value = false;
  fileError.value = null;
  importedGame.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function handleDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) await processFile(file);
}

async function handleFileSelect(e) {
  const file = e.target?.files?.[0];
  if (file) await processFile(file);
}

async function processFile(file) {
  fileError.value = null;
  importedGame.value = null;

  try {
    const { meta, state } = await readSaveFile(file);
    importedGame.value = { meta, state };
  } catch (err) {
    fileError.value = err.message || 'Erreur lors de la lecture du fichier';
  }
}

function loadImported() {
  if (!importedGame.value) return;
  emit('load', {
    meta: importedGame.value.meta,
    state: importedGame.value.state
  });
  emit('update:modelValue', false);
}

async function handleLoad(game) {
  loadingGameId.value = game.id;

  const result = await loadGame(game.id);

  loadingGameId.value = null;

  if (result.success) {
    emit('load', {
      meta: result.meta,
      state: result.state
    });
    emit('update:modelValue', false);
  }
}

function handleRefresh() {
  fetchGames();
}

async function handleMigrate(game) {
  loadingGameId.value = game.id;
  await migrateToCloud(game.id, true);
  loadingGameId.value = null;
}

function confirmDelete(game) {
  gameToDelete.value = game;
}

async function executeDelete() {
  if (!gameToDelete.value) return;

  isDeleting.value = true;
  await deleteGame(gameToDelete.value.id);
  isDeleting.value = false;
  gameToDelete.value = null;
}

function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}
</script>

<style scoped>
.load-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.load-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.storage-indicator {
  display: flex;
  align-items: center;
}

.storage-mode {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-full);
}

.storage-mode--cloud {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-accent);
}

.storage-mode--local {
  background: var(--color-canvas);
  color: var(--color-ink-muted);
}

.header-actions {
  display: flex;
  gap: var(--space-xs);
}

/* File import zone */
.file-import-zone {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-canvas);
  border-radius: var(--radius-md);
}

.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  padding: var(--space-lg);
  border: 2px dashed var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: var(--transition-fast);
}

.drop-zone:hover,
.drop-zone--active {
  border-color: var(--color-accent);
  background: rgba(59, 130, 246, 0.04);
}

.drop-zone--error {
  border-color: var(--color-danger);
}

.drop-zone-label {
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 1;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}

.drop-icon {
  width: 28px;
  height: 28px;
  color: var(--color-ink-muted);
  pointer-events: none;
}

.drop-text {
  margin: var(--space-xs) 0 0;
  font-size: 13px;
  text-align: center;
  color: var(--color-ink-soft);
  pointer-events: none;
}

.drop-hint {
  color: var(--color-accent);
  font-weight: 500;
}

.imported-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.imported-preview .btn {
  align-self: flex-end;
}

/* Games list */
.games-section {
  max-height: 400px;
  overflow-y: auto;
}

.list-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-lg);
  text-align: center;
}

.list-state--loading {
  gap: var(--space-sm);
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

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: var(--color-ink-subtle);
}

.empty-text {
  margin: var(--space-sm) 0 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-ink-muted);
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Game card */
.game-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.game-card:hover {
  border-color: var(--color-line-strong);
}

.game-card--loading {
  opacity: 0.6;
  pointer-events: none;
}

.game-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.game-badge {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: var(--radius-sm);
}

.game-badge--cloud {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-accent);
}

.game-badge--local {
  background: var(--color-canvas);
  color: var(--color-ink-muted);
}

.game-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
}

.game-row {
  display: flex;
  gap: var(--space-xs);
  font-size: 12px;
}

.game-row--muted {
  opacity: 0.7;
}

.game-label {
  color: var(--color-ink-muted);
}

.game-value {
  color: var(--color-ink);
  font-weight: 500;
}

.game-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-line-subtle);
}

/* Error message */
.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: 13px;
  color: var(--color-danger);
  background: rgba(220, 38, 38, 0.08);
  border-radius: var(--radius-md);
}

.error-message--sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: 12px;
}

.error-message :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  font-family: var(--font-body);
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-xs {
  padding: 4px 6px;
  font-size: 11px;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-ink-muted);
}

.btn-ghost:hover:not(:disabled) {
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

.btn-danger {
  background: var(--color-danger);
  border: 1px solid var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn :deep(svg) {
  width: 14px;
  height: 14px;
}

.btn-xs :deep(svg) {
  width: 12px;
  height: 12px;
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

.load-actions {
  display: flex;
  justify-content: flex-end;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 200ms ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
