<template>
  <div class="user-menu">
    <template v-if="isAuthenticated">
      <UserDropdown :username="profile?.username || 'Utilisateur'" ref="dropdownRef">
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
          type="button"
          class="dropdown-item"
          role="menuitem"
          @click="goToAccount"
        >
          <UIIcon type="human" size="sm" />
          Mon compte
        </button>
        <hr class="dropdown-divider" />
        <button
          type="button"
          class="dropdown-item dropdown-item--danger"
          role="menuitem"
          @click="handleLogout"
        >
          <UIIcon type="close" size="sm" />
          Déconnexion
        </button>
      </UserDropdown>
    </template>
    <template v-else-if="isConfigured">
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="showAuthModal = true"
      >
        <UIIcon type="human" size="sm" />
        Se connecter
      </button>
    </template>
    <!-- Si Supabase non configuré, on n'affiche rien -->

    <AuthModal v-model="showAuthModal" />
    <LoadGameModal
      v-model="showLoadModal"
      @load="handleLoad"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import AuthModal from './AuthModal.vue';
import LoadGameModal from './LoadGameModal.vue';
import UserDropdown from './UserDropdown.vue';
import { useAuth } from '../composables/useAuth.js';

const emit = defineEmits(['load-game', 'go-to-account']);

const { isAuthenticated, isConfigured, profile, logout } = useAuth();

const showAuthModal = ref(false);
const showLoadModal = ref(false);
const dropdownRef = ref(null);

function handleLoadGame() {
  dropdownRef.value?.close();
  showLoadModal.value = true;
}

function handleLoad(loadData) {
  showLoadModal.value = false;
  emit('load-game', loadData);
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
