<template>
  <div class="user-dropdown" ref="dropdownRef">
    <button
      type="button"
      class="user-dropdown__trigger"
      @click="toggleOpen"
      :aria-expanded="isOpen"
    >
      <span class="user-dropdown__username">{{ username }}</span>
      <UIIcon
        type="chevron-down"
        size="xs"
        class="user-dropdown__chevron"
        :class="{ 'user-dropdown__chevron--rotated': isOpen }"
      />
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="user-dropdown__menu" role="menu">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import UIIcon from './icons/UIIcon.vue';

defineProps({
  username: {
    type: String,
    required: true
  }
});

const isOpen = ref(false);
const dropdownRef = ref(null);

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    close();
  }
}

function handleEscape(event) {
  if (event.key === 'Escape' && isOpen.value) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});

defineExpose({ close });
</script>

<style scoped>
.user-dropdown {
  position: relative;
}

.user-dropdown__trigger {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-body, inherit);
  color: var(--color-ink);
  transition: var(--transition-fast);
}

.user-dropdown__trigger:hover {
  background: var(--color-canvas);
}

.user-dropdown__username {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown__chevron {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.user-dropdown__chevron--rotated {
  transform: rotate(180deg);
}

.user-dropdown__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 200px;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-xs);
  z-index: var(--z-dropdown, 300);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
