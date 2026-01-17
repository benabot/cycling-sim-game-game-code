<template>
  <div class="user-menu">
    <template v-if="isAuthenticated">
      <span class="user-menu__username">{{ profile?.username }}</span>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="handleLogout"
      >
        Déconnexion
      </button>
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import AuthModal from './AuthModal.vue';
import { useAuth } from '../composables/useAuth.js';

const { isAuthenticated, isConfigured, profile, logout } = useAuth();

const showAuthModal = ref(false);

async function handleLogout() {
  await logout();
}
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.user-menu__username {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
}

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
</style>
