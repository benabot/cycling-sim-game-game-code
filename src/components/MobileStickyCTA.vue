<template>
  <div class="mobile-sticky-cta" role="presentation">
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
defineProps({
  label: { type: String, default: 'Continuer' },
  disabled: { type: Boolean, default: false },
  hint: { type: String, default: '' }
});

defineEmits(['click']);
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
