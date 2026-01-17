<template>
  <Teleport to="body">
    <Transition name="prompt">
      <div v-if="show" class="autosave-prompt-overlay">
        <div class="autosave-prompt">
          <div class="prompt-icon">
            <UIIcon type="history" />
          </div>
          
          <div class="prompt-content">
            <h3 class="prompt-title">Partie en cours détectée</h3>
            <p class="prompt-description">
              {{ meta?.name || 'Sauvegarde automatique' }}
            </p>
            <p class="prompt-meta">
              <span v-if="meta?.raceName">{{ meta.raceName }}</span>
              <span v-if="meta?.currentTurn"> · Tour {{ meta.currentTurn }}</span>
              <span v-if="ageText"> · {{ ageText }}</span>
            </p>
          </div>

          <div class="prompt-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleIgnore"
            >
              Ignorer
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="handleResume"
            >
              <UIIcon type="play" />
              Reprendre
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import { useSaveGame } from '../composables/useSaveGame.js';

const emit = defineEmits(['resume', 'ignore']);

const { checkAutoSave, loadFromAutoSave, clearAuto, autoSaveMeta, autoSaveAgeText } = useSaveGame();

const show = ref(false);
const meta = ref(null);
const ageText = ref(null);

onMounted(() => {
  const autoSave = checkAutoSave();
  if (autoSave) {
    meta.value = autoSave.meta;
    ageText.value = autoSave.age;
    show.value = true;
  }
});

function handleResume() {
  const result = loadFromAutoSave();
  if (result) {
    show.value = false;
    emit('resume', result);
  }
}

function handleIgnore() {
  clearAuto();
  show.value = false;
  emit('ignore');
}
</script>

<style scoped>
.autosave-prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 24, 0.6);
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-lg);
}

.autosave-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  max-width: 380px;
  padding: var(--space-xl);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 48px rgba(31, 35, 40, 0.25);
  text-align: center;
}

.prompt-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--color-canvas);
  border-radius: 50%;
  color: var(--color-accent);
}

.prompt-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.prompt-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.prompt-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-ink);
}

.prompt-description {
  margin: 0;
  font-size: 14px;
  color: var(--color-ink);
  font-weight: 500;
}

.prompt-meta {
  margin: 0;
  font-size: 13px;
  color: var(--color-ink-muted);
}

.prompt-actions {
  display: flex;
  gap: var(--space-sm);
  width: 100%;
}

.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: 12px 16px;
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

.btn-primary:hover {
  background: #2d3339;
}

.btn :deep(svg) {
  width: 16px;
  height: 16px;
}

/* Transition */
.prompt-enter-active,
.prompt-leave-active {
  transition: opacity 200ms ease;
}

.prompt-enter-active .autosave-prompt,
.prompt-leave-active .autosave-prompt {
  transition: transform 200ms ease, opacity 200ms ease;
}

.prompt-enter-from,
.prompt-leave-to {
  opacity: 0;
}

.prompt-enter-from .autosave-prompt,
.prompt-leave-to .autosave-prompt {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
