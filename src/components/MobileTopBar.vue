<template>
  <div class="mobile-top-bar">
    <span class="mobile-top-bar__title">{{ title }}</span>
    <button type="button" class="mobile-top-bar__rules" @click="$emit('rules')">
      <UIIcon type="book" size="sm" />
      <span>Règles</span>
    </button>
  </div>
</template>

<script setup>
import { UIIcon } from './icons';

defineProps({
  title: { type: String, default: 'Avant-course' }
});

defineEmits(['rules']);
</script>

<style scoped>
.mobile-top-bar {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: calc(var(--space-sm) + env(safe-area-inset-top)) var(--space-md) var(--space-sm);
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--color-line);
  position: sticky;
  top: 0;
  z-index: 15;
  backdrop-filter: blur(10px);
}

.mobile-top-bar__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.mobile-top-bar__rules {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink);
}

@media (max-width: 720px) {
  .mobile-top-bar {
    display: flex;
  }
}
</style>
