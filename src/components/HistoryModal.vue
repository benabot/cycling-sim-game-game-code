<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="history-modal-overlay"
      role="presentation"
      @click.self="closeModal"
    >
      <div
        ref="panelRef"
        class="history-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Historique"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header class="history-modal__header">
          <h2 class="history-modal__title">Historique</h2>
          <button
            type="button"
            class="history-modal__close"
            aria-label="Fermer l'historique"
            @click="closeModal"
          >
            <UIIcon type="close" size="sm" />
            <span>Fermer</span>
          </button>
        </header>

        <div class="history-modal__body">
          <p v-if="!cleanedEntries.length" class="history-modal__empty">
            Aucun événement pour le moment.
          </p>
          <ul v-else class="history-modal__list">
            <li v-for="(entry, index) in cleanedEntries" :key="index">
              {{ entry }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { UIIcon } from './icons';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  log: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue']);

const panelRef = ref(null);
const lastFocused = ref(null);

const cleanedEntries = computed(() => {
  return (props.log || [])
    .map(entry => normalizeLogText(getEntryText(entry)))
    .filter(text => text.length);
});

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

function getEntryText(entry) {
  if (typeof entry === 'string') return entry;
  return entry?.message || entry?.text || '';
}

function normalizeLogText(text) {
  if (!text) return '';
  let cleaned = text
    .replace(/🏁|🏆|💨|🛡️|🌀|⚔️|🍌|🤕|⚠️|🎲|▶️|➡️/g, '')
    .replace(/\[FINISH\]|\[WINNER\]|\[WIND\]|\[SHELTER\]|\[ASPIRATION\]|\[ATTACK\]|\[REFUEL\]|\[CRASH\]|\[EVENT\]/g, '')
    .replace(/[=═-]{3,}/g, '')
    .replace(/!+/g, '')
    .trim();

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/Tour\s+\d+/i, '').trim();
  return cleaned;
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
.history-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 24, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: var(--z-modal);
}

.history-modal {
  width: min(720px, 100%);
  max-height: min(82vh, 760px);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-line);
  box-shadow: 0 18px 48px rgba(31, 35, 40, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-paper);
}

.history-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.history-modal__close {
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

.history-modal__body {
  padding: var(--space-lg);
  overflow: auto;
  font-size: 16px;
}

.history-modal__empty {
  margin: 0;
  color: var(--color-ink-muted);
}

.history-modal__list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 900px) {
  .history-modal-overlay {
    align-items: stretch;
    padding: var(--space-sm);
  }

  .history-modal {
    width: 100%;
    max-height: 100%;
  }

  .history-modal__body {
    padding: var(--space-md);
  }
}
</style>
