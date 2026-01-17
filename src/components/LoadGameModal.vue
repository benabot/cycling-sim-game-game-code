<template>
  <ModalShell
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Charger une partie"
    max-width="520px"
  >
    <div class="load-content">
      <!-- Zone de drop -->
      <div
        class="drop-zone"
        :class="{ 'drop-zone--active': isDragging, 'drop-zone--error': error }"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".csg,.json"
          class="file-input"
          @change="handleFileSelect"
        />
        
        <div v-if="isLoading" class="drop-zone-loading">
          <div class="spinner"></div>
          <span>Chargement...</span>
        </div>
        
        <div v-else-if="loadedMeta" class="drop-zone-loaded">
          <UIIcon type="check" class="loaded-icon" />
          <span>Fichier prêt</span>
        </div>
        
        <div v-else class="drop-zone-empty">
          <UIIcon type="upload" class="drop-icon" />
          <p class="drop-text">
            Glissez un fichier de sauvegarde ici<br>
            <span class="drop-hint">ou cliquez pour parcourir</span>
          </p>
          <span class="drop-formats">.csg ou .json</span>
        </div>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="error-message">
        <UIIcon type="warning" />
        <span>{{ error }}</span>
      </div>

      <!-- Aperçu de la sauvegarde chargée -->
      <SavePreview v-if="loadedMeta" :meta="loadedMeta" />
    </div>

    <template #footer>
      <div class="load-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleCancel"
        >
          Annuler
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleConfirm"
          :disabled="!loadedState"
        >
          <UIIcon type="play" />
          Reprendre la partie
        </button>
      </div>
    </template>
  </ModalShell>
</template>

<script setup>
import { ref, watch } from 'vue';
import ModalShell from './ModalShell.vue';
import SavePreview from './SavePreview.vue';
import UIIcon from './icons/UIIcon.vue';
import { useSaveGame } from '../composables/useSaveGame.js';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'load']);

const { loadFromFile, isLoading: saveLoading, error: saveError } = useSaveGame();

const fileInput = ref(null);
const isDragging = ref(false);
const isLoading = ref(false);
const error = ref(null);
const loadedMeta = ref(null);
const loadedState = ref(null);

// Reset quand la modale s'ouvre/ferme
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetState();
  }
});

function resetState() {
  isDragging.value = false;
  isLoading.value = false;
  error.value = null;
  loadedMeta.value = null;
  loadedState.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleDragEnter(e) {
  isDragging.value = true;
}

function handleDragOver(e) {
  isDragging.value = true;
}

function handleDragLeave(e) {
  // Vérifier qu'on quitte vraiment la zone (pas juste un enfant)
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false;
  }
}

async function handleDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    await processFile(file);
  }
}

async function handleFileSelect(e) {
  const file = e.target?.files?.[0];
  if (file) {
    await processFile(file);
  }
}

async function processFile(file) {
  isLoading.value = true;
  error.value = null;
  loadedMeta.value = null;
  loadedState.value = null;

  try {
    const { meta, state } = await loadFromFile(file);
    loadedMeta.value = meta;
    loadedState.value = state;
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement';
    loadedMeta.value = null;
    loadedState.value = null;
  } finally {
    isLoading.value = false;
  }
}

function handleCancel() {
  resetState();
  emit('update:modelValue', false);
}

function handleConfirm() {
  if (!loadedState.value) return;
  
  emit('load', {
    meta: loadedMeta.value,
    state: loadedState.value
  });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.load-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: var(--space-xl);
  border: 2px dashed var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-canvas);
  cursor: pointer;
  transition: var(--transition-fast);
}

.drop-zone:hover {
  border-color: var(--color-accent);
  background: rgba(59, 130, 246, 0.04);
}

.drop-zone--active {
  border-color: var(--color-accent);
  background: rgba(59, 130, 246, 0.08);
}

.drop-zone--error {
  border-color: var(--color-danger);
  background: rgba(220, 38, 38, 0.04);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.drop-zone-empty,
.drop-zone-loading,
.drop-zone-loaded {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  text-align: center;
  pointer-events: none;
}

.drop-icon {
  width: 40px;
  height: 40px;
  color: var(--color-ink-muted);
}

.drop-text {
  margin: 0;
  font-size: 14px;
  color: var(--color-ink);
  line-height: 1.5;
}

.drop-hint {
  color: var(--color-accent);
  font-weight: 500;
}

.drop-formats {
  font-size: 12px;
  color: var(--color-ink-muted);
}

.drop-zone-loading {
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drop-zone-loaded {
  color: var(--color-success);
}

.loaded-icon {
  width: 32px;
  height: 32px;
}

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

.error-message :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.load-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-md);
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn :deep(svg) {
  width: 16px;
  height: 16px;
}
</style>
