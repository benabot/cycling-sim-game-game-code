<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="course-modal-overlay"
      role="presentation"
      @click.self="closeModal"
    >
      <div
        ref="panelRef"
        class="course-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Parcours"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header class="course-modal__header">
          <h2 class="course-modal__title">Parcours</h2>
          <button
            type="button"
            class="course-modal__close"
            aria-label="Fermer le parcours"
            @click="closeModal"
          >
            <UIIcon type="close" size="sm" />
            <span>Fermer</span>
          </button>
        </header>

        <div class="course-modal__body">
          <BoardMiniMap
            class="course-modal__minimap"
            :course="course"
            :leaderPosition="leaderPosition"
            :activePosition="activePosition"
            :showAction="false"
          />
          <TerrainLegend />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import { UIIcon } from './icons';
import BoardMiniMap from './BoardMiniMap.vue';
import TerrainLegend from './TerrainLegend.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  course: { type: Array, default: () => [] },
  leaderPosition: { type: Number, default: null },
  activePosition: { type: Number, default: null }
});

const emit = defineEmits(['update:modelValue']);

const panelRef = ref(null);
const lastFocused = ref(null);

function closeModal() {
  emit('update:modelValue', false);
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = getFocusableElements();
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFocusableElements() {
  if (!panelRef.value) return [];
  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];
  return Array.from(panelRef.value.querySelectorAll(selectors.join(',')));
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      lastFocused.value = document.activeElement;
      document.body.style.overflow = 'hidden';
      nextTick(() => {
        const focusable = getFocusableElements();
        if (focusable.length) {
          focusable[0].focus();
        } else {
          panelRef.value?.focus();
        }
      });
    } else {
      document.body.style.overflow = '';
      lastFocused.value?.focus?.();
    }
  }
);
</script>

<style scoped>
.course-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 24, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: var(--z-modal);
}

.course-modal {
  width: min(920px, 100%);
  max-height: min(88vh, 820px);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-line);
  box-shadow: 0 18px 48px rgba(31, 35, 40, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.course-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-paper);
}

.course-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.course-modal__close {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.course-modal__body {
  padding: var(--space-lg);
  overflow: auto;
  display: grid;
  gap: var(--space-md);
  min-height: 0;
}

.course-modal__body :deep(.board-minimap) {
  position: static;
  top: auto;
  box-shadow: none;
  border: 1px solid var(--color-line);
}

@media (max-width: 900px) {
  .course-modal-overlay {
    align-items: stretch;
    padding: var(--space-sm);
  }

  .course-modal {
    width: 100%;
    max-height: 100%;
  }

  .course-modal__body {
    padding: var(--space-md);
  }
}
</style>
