<template>
  <div class="mobile-sticky-cta" role="presentation">
    <div v-if="actions.length" class="mobile-sticky-cta__actions">
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="mobile-sticky-cta__action"
        :aria-label="action.ariaLabel || action.label"
        @click="$emit('action', action.id)"
      >
        <UIIcon :type="action.icon" size="sm" />
        <span>{{ action.label }}</span>
      </button>
    </div>
    <button
      type="button"
      class="btn btn-primary mobile-sticky-cta__button"
      :disabled="disabled"
      @click="$emit('click')"
    >
      {{ label }}
    </button>
    <p v-if="hint" class="mobile-sticky-cta__hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { UIIcon } from './icons';

defineProps({
  label: { type: String, default: 'Continuer' },
  disabled: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  actions: { type: Array, default: () => [] }
});

defineEmits(['click', 'action']);
</script>

<style scoped>
.mobile-sticky-cta {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: var(--space-sm) var(--space-md) calc(var(--space-sm) + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid var(--color-line);
  box-shadow: 0 -10px 24px rgba(31, 35, 40, 0.08);
  z-index: 14;
  display: none;
  flex-direction: column;
  gap: 4px;
}

.mobile-sticky-cta__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
}

.mobile-sticky-cta__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  background: var(--color-paper);
  font-size: 12px;
  color: var(--color-ink);
}

.mobile-sticky-cta__action :deep(svg) {
  width: 14px;
  height: 14px;
}

.mobile-sticky-cta__button {
  width: 100%;
  min-height: 44px;
  font-weight: 600;
}

.mobile-sticky-cta__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-ink-muted);
  text-align: center;
}

@media (max-width: 720px) {
  .mobile-sticky-cta {
    display: flex;
  }
}
</style>
