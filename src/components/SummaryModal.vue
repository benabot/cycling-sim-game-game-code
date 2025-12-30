<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="summary-modal-overlay"
      role="presentation"
      @click.self="closeModal"
    >
      <div
        ref="panelRef"
        class="summary-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header class="summary-modal__header">
          <h2 :id="titleId" class="summary-modal__title">{{ title }}</h2>
          <button
            type="button"
            class="summary-modal__close"
            aria-label="Fermer le résumé"
            @click="closeModal"
          >
            <UIIcon type="close" size="sm" />
          </button>
        </header>

        <div class="summary-modal__body">
          <ul class="summary-modal__list">
            <li v-for="item in items" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import { UIIcon } from './icons';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Résumé' },
  items: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue']);

const panelRef = ref(null);
const lastFocused = ref(null);
const titleId = `summary-title-${Math.random().toString(36).slice(2, 8)}`;

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
.summary-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 24, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: var(--z-modal);
}

.summary-modal {
  width: min(520px, 100%);
  max-height: min(70vh, 520px);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-line);
  box-shadow: 0 16px 36px rgba(31, 35, 40, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.summary-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-paper);
}

.summary-modal__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.summary-modal__close {
  min-height: 44px;
  min-width: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-line);
  background: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.summary-modal__body {
  padding: var(--space-md) var(--space-lg);
  font-size: 16px;
  overflow: auto;
}

.summary-modal__list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (max-width: 720px) {
  .summary-modal-overlay {
    align-items: flex-end;
    padding: var(--space-sm);
  }

  .summary-modal {
    width: 100%;
    max-height: 70vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
}
</style>
