<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="close"
        @keydown.esc="close"
      >
        <div
          class="modal-container"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :style="{ maxWidth, maxHeight }"
          ref="modalRef"
        >
          <header class="modal-header">
            <h2 :id="titleId" class="modal-title">{{ title }}</h2>
            <button
              class="modal-close"
              @click="close"
              aria-label="Fermer"
              type="button"
            >
              <UIIcon type="close" />
            </button>
          </header>
          <div class="modal-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import UIIcon from './icons/UIIcon.vue';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, required: true },
  maxWidth: { type: String, default: '720px' },
  maxHeight: { type: String, default: '82vh' }
});

const emit = defineEmits(['update:modelValue']);

const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
const modalRef = ref(null);
let lastFocused = null;
let trapElement = null;

function close() {
  emit('update:modelValue', false);
}

// Focus management
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    lastFocused = document.activeElement;
    await nextTick();
    if (modalRef.value) {
      const firstFocusable = modalRef.value.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    }
  } else {
    if (lastFocused) {
      lastFocused.focus();
      lastFocused = null;
    }
  }
});

// Focus trap
function handleTabKey(e) {
  if (!modalRef.value) return;

  const focusableElements = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }
}

function handleKeydown(e) {
  if (!props.modelValue) return;

  if (e.key === 'Escape') {
    close();
  } else if (e.key === 'Tab') {
    handleTabKey(e);
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 24, 0.75);
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-lg);
  overscroll-behavior: contain;
}

.modal-container {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 48px rgba(31, 35, 40, 0.25);
  overflow: hidden;
  width: 100%;
  max-width: var(--max-width, 720px);
  max-height: var(--max-height, 82vh);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-paper);
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-ink);
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 32px;
  min-height: 32px;
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.modal-close:hover {
  background: var(--color-canvas);
  color: var(--color-ink);
}

.modal-close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.modal-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: var(--space-lg);
  overscroll-behavior: contain;
}

.modal-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-line);
  background: var(--color-paper);
  flex-shrink: 0;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 200ms ease, opacity 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95);
}

/* Mobile responsive */
@media (max-width: 720px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .modal-container {
    max-height: calc(100vh - var(--space-md) * 2);
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--space-md);
  }

  .modal-title {
    font-size: 16px;
  }
}
</style>
