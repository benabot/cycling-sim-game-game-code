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

      <!-- Destination de sauvegarde -->
      <div class="storage-choice">
        <span class="storage-choice__label">Destination</span>
        <div
          class="segmented storage-segmented"
          role="radiogroup"
          aria-label="Destination de sauvegarde"
        >
          <button
            type="button"
            class="segmented-item"
            :class="{ 'segmented-item-active': saveTarget === 'local' }"
            role="radio"
            :aria-checked="saveTarget === 'local'"
            @click="setSaveTarget('local')"
          >
            <UIIcon type="download" size="sm" />
            Local
          </button>
          <button
            type="button"
            class="segmented-item"
            :class="{ 'segmented-item-active': saveTarget === 'cloud' }"
            role="radio"
            :aria-checked="saveTarget === 'cloud'"
            :disabled="!canUseCloud"
            :aria-disabled="!canUseCloud"
            :title="canUseCloud ? 'Sauvegarde dans le cloud' : 'Connecte-toi pour activer la sauvegarde cloud.'"
            @click="setSaveTarget('cloud')"
          >
            <UIIcon type="save" size="sm" />
            Cloud
          </button>
        </div>
        <p class="storage-helper">{{ storageHelper }}</p>
        <p v-if="!canUseCloud" class="storage-helper storage-helper--muted">
          Connecte-toi pour activer la sauvegarde cloud.
        </p>
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
            Sauvegarder ({{ effectiveMode === 'cloud' ? 'Cloud' : 'Local' }})
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

const saveTarget = computed({
  get() {
    return effectiveMode.value;
  },
  set(target) {
    if (target === 'cloud' && !canUseCloud.value) return;
    forceLocal.value = target === 'local';
  }
});

const storageHelper = computed(() => {
  if (saveTarget.value === 'cloud') {
    return 'Sauvegarde liée à ton compte, accessible sur tous tes appareils.';
  }
  return 'Sauvegarde sur cet appareil.';
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

function setSaveTarget(target) {
  saveTarget.value = target;
}

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

/* Storage choice */
.storage-choice {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.storage-choice__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink);
}

.storage-segmented {
  width: 100%;
}

.storage-segmented .segmented-item {
  flex: 1;
}

.storage-segmented .segmented-item-active {
  background: var(--color-ink);
  color: var(--color-paper);
  border-color: var(--color-ink);
}

.storage-segmented .segmented-item-active :deep(svg) {
  color: var(--color-paper);
}

.storage-segmented .segmented-item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.storage-helper {
  margin: 0;
  font-size: 12px;
  color: var(--color-ink-soft);
}

.storage-helper--muted {
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
