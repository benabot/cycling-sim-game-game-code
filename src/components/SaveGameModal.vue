<template>
  <ModalShell
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Sauvegarder la partie"
    max-width="480px"
  >
    <div class="save-content">
      <!-- Aperçu de la partie -->
      <SavePreview v-if="previewMeta" :meta="previewMeta" />

      <!-- Nom de la sauvegarde -->
      <div class="save-field">
        <label for="save-name" class="save-label">Nom de la sauvegarde</label>
        <input
          id="save-name"
          v-model="saveName"
          type="text"
          class="save-input"
          placeholder="Ma partie..."
          maxlength="50"
          @keydown.enter="handleSave"
        />
      </div>

      <!-- Indicateur de destination -->
      <div class="storage-info">
        <div class="storage-indicator">
          <UIIcon :type="storageMode === 'cloud' ? 'save' : 'download'" size="sm" />
          <span>{{ storageMode === 'cloud' ? 'Sauvegarde dans le cloud' : 'Sauvegarde locale' }}</span>
        </div>
        <button
          v-if="canUseCloud"
          type="button"
          class="btn btn-ghost btn-xs"
          @click="forceLocal = !forceLocal"
          :title="forceLocal ? 'Utiliser le cloud' : 'Forcer sauvegarde locale'"
        >
          {{ forceLocal ? 'Cloud' : 'Local' }}
        </button>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="error-message">
        <UIIcon type="warning" />
        <span>{{ error }}</span>
      </div>

      <!-- Message de succès -->
      <div v-if="successMessage" class="success-message">
        <UIIcon type="check" />
        <span>{{ successMessage }}</span>
      </div>
    </div>

    <template #footer>
      <div class="save-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('update:modelValue', false)"
        >
          Annuler
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSave"
          :disabled="!saveName.trim() || isSaving"
        >
          <template v-if="isSaving">
            <span class="spinner-small"></span>
            Sauvegarde...
          </template>
          <template v-else>
            <UIIcon :type="effectiveMode === 'cloud' ? 'save' : 'download'" />
            Sauvegarder
          </template>
        </button>
      </div>
    </template>
  </ModalShell>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ModalShell from './ModalShell.vue';
import SavePreview from './SavePreview.vue';
import UIIcon from './icons/UIIcon.vue';
import { useStorage } from '../composables/useStorage.js';
import { useSaveGame } from '../composables/useSaveGame.js';

const props = defineProps({
  modelValue: Boolean,
  gameState: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { saveGame, storageMode, canUseCloud } = useStorage();
const { getPreviewMeta } = useSaveGame();

const saveName = ref('');
const forceLocal = ref(false);
const error = ref(null);
const successMessage = ref(null);
const isSaving = ref(false);

// Mode effectif (cloud sauf si forcé local)
const effectiveMode = computed(() => {
  if (forceLocal.value || !canUseCloud.value) {
    return 'local';
  }
  return storageMode.value;
});

// Générer un nom par défaut basé sur l'état du jeu
const defaultName = computed(() => {
  if (!props.gameState) return 'Ma partie';

  const turn = props.gameState.currentTurn || 1;
  let prefix = 'Partie';

  if (props.gameState.gameConfig?.classicId) {
    const classicNames = {
      ardennaise: 'Ardennaise',
      lombarde: 'Lombarde',
      riviera: 'Riviera',
      nord: 'Nord'
    };
    prefix = classicNames[props.gameState.gameConfig.classicId] || 'Course';
  } else if (props.gameState.stageRace) {
    const stage = (props.gameState.stageRace.currentStageIndex || 0) + 1;
    prefix = `Étape ${stage}`;
  }

  return `${prefix} - Tour ${turn}`;
});

// Aperçu des métadonnées
const previewMeta = computed(() => {
  if (!props.gameState) return null;
  return getPreviewMeta(props.gameState, saveName.value || defaultName.value);
});

// Initialiser quand la modale s'ouvre
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    saveName.value = defaultName.value;
    error.value = null;
    successMessage.value = null;
    forceLocal.value = false;
  }
});

async function handleSave() {
  if (!saveName.value.trim() || !props.gameState) return;

  isSaving.value = true;
  error.value = null;
  successMessage.value = null;

  const result = await saveGame(saveName.value.trim(), props.gameState, {
    forceLocal: forceLocal.value
  });

  isSaving.value = false;

  if (result.success) {
    // Afficher un message adapté
    if (result.fallback) {
      successMessage.value = `Sauvegardé en local (cloud indisponible)`;
    } else if (result.source === 'cloud') {
      successMessage.value = 'Partie sauvegardée dans le cloud';
    } else {
      successMessage.value = 'Partie sauvegardée localement';
    }

    emit('saved');

    // Fermer après un court délai pour montrer le succès
    setTimeout(() => {
      emit('update:modelValue', false);
    }, 800);
  } else {
    error.value = result.error || 'Erreur lors de la sauvegarde';
  }
}
</script>

<style scoped>
.save-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.save-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.save-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
}

.save-input {
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font-body);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  transition: var(--transition-fast);
}

.save-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.save-input::placeholder {
  color: var(--color-ink-muted);
}

/* Storage info */
.storage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-canvas);
  border-radius: var(--radius-md);
}

.storage-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 13px;
  color: var(--color-ink-soft);
}

.storage-indicator :deep(svg) {
  width: 16px;
  height: 16px;
  color: var(--color-ink-muted);
}

/* Messages */
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

.success-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: 13px;
  color: var(--color-success);
  background: rgba(53, 181, 106, 0.08);
  border-radius: var(--radius-md);
}

.success-message :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Footer actions */
.save-actions {
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

.btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-ink-muted);
}

.btn-ghost:hover {
  background: var(--color-surface);
  color: var(--color-ink);
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
</style>
