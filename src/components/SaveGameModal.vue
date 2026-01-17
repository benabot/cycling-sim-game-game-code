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
        <span class="save-hint">Ce nom apparaîtra dans le fichier téléchargé</span>
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
          :disabled="!saveName.trim()"
        >
          <UIIcon type="download" />
          Télécharger
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
import { useSaveGame } from '../composables/useSaveGame.js';

const props = defineProps({
  modelValue: Boolean,
  gameState: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { saveToFile, getPreviewMeta } = useSaveGame();

const saveName = ref('');

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

// Initialiser le nom quand la modale s'ouvre
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    saveName.value = defaultName.value;
  }
});

function handleSave() {
  if (!saveName.value.trim() || !props.gameState) return;
  
  const success = saveToFile(props.gameState, saveName.value.trim());
  
  if (success) {
    emit('saved');
    emit('update:modelValue', false);
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

.save-hint {
  font-size: 12px;
  color: var(--color-ink-muted);
}

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
