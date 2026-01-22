<template>
  <div class="user-menu">
    <UserDropdown :username="menuLabel" ref="dropdownRef">
      <button
        v-if="canSave"
        type="button"
        class="dropdown-item"
        role="menuitem"
        @click="handleSaveGame"
      >
        <UIIcon type="save" size="sm" />
        Sauvegarder
      </button>
      <button
        type="button"
        class="dropdown-item"
        role="menuitem"
        @click="handleLoadGame"
      >
        <UIIcon type="upload" size="sm" />
        Charger une partie
      </button>
      <button
        v-if="isAuthenticated"
        type="button"
        class="dropdown-item"
        role="menuitem"
        @click="goToAccount"
      >
        <UIIcon type="human" size="sm" />
        Mon compte
      </button>
      <hr v-if="isAuthenticated" class="dropdown-divider" />
      <button
        v-if="isAuthenticated"
        type="button"
        class="dropdown-item dropdown-item--danger"
        role="menuitem"
        @click="handleLogout"
      >
        <UIIcon type="close" size="sm" />
        Déconnexion
      </button>
      <button
        v-else-if="isConfigured"
        type="button"
        class="dropdown-item"
        role="menuitem"
        @click="showAuthModal = true"
      >
        <UIIcon type="human" size="sm" />
        Se connecter
      </button>
    </UserDropdown>

    <AuthModal v-model="showAuthModal" />
    <LoadGameModal
      v-model="showLoadModal"
      @load="handleLoad"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import AuthModal from './AuthModal.vue';
import LoadGameModal from './LoadGameModal.vue';
import UserDropdown from './UserDropdown.vue';
import { useAuth } from '../composables/useAuth.js';
import { trackEvent } from '../analytics/goatcounter.js';

defineProps({
  canSave: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['load-game', 'go-to-account', 'save-game']);

const { isAuthenticated, isConfigured, profile, logout } = useAuth();

const showAuthModal = ref(false);
const showLoadModal = ref(false);
const dropdownRef = ref(null);
const menuLabel = computed(() => (
  isAuthenticated.value ? (profile.value?.username || 'Utilisateur') : 'Menu'
));

watch(showAuthModal, (isOpen) => {
  if (isOpen) {
    trackEvent('auth_open');
  }
});

function handleLoadGame() {
  dropdownRef.value?.close();
  showLoadModal.value = true;
}

function handleLoad(loadData) {
  showLoadModal.value = false;
  emit('load-game', loadData);
}

function handleSaveGame() {
  dropdownRef.value?.close();
  emit('save-game');
}

function goToAccount() {
  dropdownRef.value?.close();
  emit('go-to-account');
}

async function handleLogout() {
  dropdownRef.value?.close();
  await logout();
}
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  font-family: var(--font-body, inherit);
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-sm {
  padding: 6px 10px;
  font-size: 13px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-ink-soft);
}

.btn-ghost:hover {
  background: var(--color-canvas);
  color: var(--color-ink);
}

.btn-ghost :deep(svg) {
  width: 16px;
  height: 16px;
}

/* Dropdown items */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: var(--font-body, inherit);
  color: var(--color-ink);
  cursor: pointer;
  text-align: left;
  transition: var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-canvas);
}

.dropdown-item :deep(svg) {
  width: 16px;
  height: 16px;
  color: var(--color-ink-muted);
}

.dropdown-item--danger {
  color: var(--color-red-ui, #d84a4a);
}

.dropdown-item--danger:hover {
  background: rgba(216, 74, 74, 0.08);
}

.dropdown-item--danger :deep(svg) {
  color: var(--color-red-ui, #d84a4a);
}

.dropdown-divider {
  height: 1px;
  margin: var(--space-xs) 0;
  background: var(--color-line);
  border: none;
}
</style>
