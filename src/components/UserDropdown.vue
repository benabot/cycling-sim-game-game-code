<template>
  <div class="user-dropdown" ref="dropdownRef">
    <button
      type="button"
      class="user-dropdown__trigger"
      @click="toggleOpen"
      :aria-expanded="isOpen"
      ref="triggerRef"
    >
      <span class="user-dropdown__username">{{ username }}</span>
      <UIIcon
        type="chevron-down"
        size="xs"
        class="user-dropdown__chevron"
        :class="{ 'user-dropdown__chevron--rotated': isOpen }"
      />
    </button>

    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="menuRef"
          class="user-dropdown__menu user-dropdown__menu--portal"
          role="menu"
          :style="menuStyle"
        >
          <slot />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import UIIcon from './icons/UIIcon.vue';

defineProps({
  username: {
    type: String,
    required: true
  }
});

const isOpen = ref(false);
const dropdownRef = ref(null);
const triggerRef = ref(null);
const menuRef = ref(null);
const menuStyle = ref({});
let positionRaf = null;

const MENU_GAP = 8;
const VIEWPORT_MARGIN = 8;

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function handleClickOutside(event) {
  const target = event.target;
  if (dropdownRef.value && dropdownRef.value.contains(target)) return;
  if (menuRef.value && menuRef.value.contains(target)) return;
  close();
}

function handleEscape(event) {
  if (event.key === 'Escape' && isOpen.value) {
    close();
  }
}

function updateMenuPosition() {
  if (!triggerRef.value || !menuRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const menuRect = menuRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const preferredTop = triggerRect.bottom + MENU_GAP;
  const maxTop = viewportHeight - VIEWPORT_MARGIN - menuRect.height;
  const top = Math.max(VIEWPORT_MARGIN, Math.min(preferredTop, maxTop));

  const preferredLeft = triggerRect.right - menuRect.width;
  const maxLeft = viewportWidth - VIEWPORT_MARGIN - menuRect.width;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(preferredLeft, maxLeft));

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  };
}

function scheduleUpdate() {
  if (positionRaf) cancelAnimationFrame(positionRaf);
  positionRaf = requestAnimationFrame(updateMenuPosition);
}

watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);
  } else {
    window.removeEventListener('resize', scheduleUpdate);
    window.removeEventListener('scroll', scheduleUpdate, true);
  }
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
  window.removeEventListener('resize', scheduleUpdate);
  window.removeEventListener('scroll', scheduleUpdate, true);
  if (positionRaf) cancelAnimationFrame(positionRaf);
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
  min-width: 200px;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-xs);
  z-index: var(--z-popover, 500);
}

.user-dropdown__menu--portal {
  position: fixed;
  top: 0;
  left: 0;
  right: auto;
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
