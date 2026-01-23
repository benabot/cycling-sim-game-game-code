<template>
  <div class="app-root app-container">
    <!-- Setup Screen -->
    <SetupScreen
      v-if="gameScreen === 'setup'"
      @start="startGame"
      @restore="handleRestore"
      @go-to-account="goToAccount"
    />

    <!-- Game Board -->
    <GameBoard
      v-else-if="gameScreen === 'playing'"
      :key="gameKey"
      :gameConfig="gameConfig"
      :savedState="savedState"
      @backToSetup="backToSetup"
      @restore="handleRestore"
      @go-to-account="goToAccount"
    />

    <!-- Account Page -->
    <AccountPage
      v-else-if="gameScreen === 'account'"
      :returnTarget="accountReturnTarget"
      @back="handleAccountBack"
      @load="handleAccountLoad"
      @account-deleted="handleAccountDeleted"
    />

    <!-- Reset Password Page -->
    <ResetPasswordPage
      v-else-if="gameScreen === 'reset-password'"
      @go-to-login="handleResetComplete"
    />

    <IntroSplash v-if="isIntroVisible" @skip="dismissIntroSplash" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { SetupScreen } from './components/index.js';
import GameBoard from './ui/GameBoard.vue';
import IntroSplash from './ui/IntroSplash.vue';
import AccountPage from './views/AccountPage.vue';
import ResetPasswordPage from './views/ResetPasswordPage.vue';
import { useAuth } from './composables/useAuth.js';
import { useStorage } from './composables/useStorage.js';
import { supabase } from './lib/supabase.js';

const { initSession } = useAuth();
const { loadGame } = useStorage();

onMounted(async () => {
  // Vérifier si on est sur la page de reset password
  if (window.location.pathname.includes('/reset-password')) {
    // Attendre que Supabase traite le token dans l'URL
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        gameScreen.value = 'reset-password';
        return;
      }
    }
    // Si pas de session valide, afficher quand même la page (elle gérera l'erreur)
    gameScreen.value = 'reset-password';
    return;
  }

  initSession();
});

// Screen state: 'setup' | 'playing' | 'account'
const gameScreen = ref('setup');
const gameConfig = ref(null);
const savedState = ref(null);
const gameKey = ref(0); // Used to force GameBoard re-mount on restore
const isIntroVisible = ref(false);
const accountReturnTarget = ref('setup');
let introTimer = null;

function showIntroSplash() {
  isIntroVisible.value = true;
  if (introTimer) {
    clearTimeout(introTimer);
  }
  introTimer = setTimeout(() => {
    isIntroVisible.value = false;
    introTimer = null;
  }, 3000);
}

function dismissIntroSplash() {
  isIntroVisible.value = false;
  if (introTimer) {
    clearTimeout(introTimer);
    introTimer = null;
  }
}

function startGame(config) {
  gameConfig.value = config;
  savedState.value = null; // Clear any saved state for new game
  gameKey.value++; // Force re-mount
  gameScreen.value = 'playing';
  showIntroSplash();
}

function handleRestore({ meta, state }) {
  // Store the saved state to pass to GameBoard
  savedState.value = state;
  gameConfig.value = state.gameConfig || null;
  gameKey.value++; // Force re-mount to trigger restore
  gameScreen.value = 'playing';
  // No intro splash for restored games
  dismissIntroSplash();
}

async function handleAccountLoad(game) {
  // Load the game from storage and restore
  const result = await loadGame(game.id);
  if (result.success) {
    handleRestore({ meta: result.meta, state: result.state });
  }
}

function handleAccountBack(target) {
  const destination = target || accountReturnTarget.value;
  if (destination === 'game' && (gameConfig.value || savedState.value)) {
    gameScreen.value = 'playing';
    return;
  }
  backToSetup();
}

function backToSetup() {
  gameScreen.value = 'setup';
  gameConfig.value = null;
  savedState.value = null;
  dismissIntroSplash();
}

function goToAccount() {
  accountReturnTarget.value = gameScreen.value === 'playing' ? 'game' : 'setup';
  gameScreen.value = 'account';
}

function handleResetComplete() {
  // Nettoyer l'URL après le reset
  if (window.history.replaceState) {
    window.history.replaceState({}, document.title, '/app/');
  }
  gameScreen.value = 'setup';
}

function handleAccountDeleted() {
  // Retourner à l'écran de setup après suppression du compte
  gameScreen.value = 'setup';
  gameConfig.value = null;
  savedState.value = null;
}

onBeforeUnmount(() => {
  if (introTimer) {
    clearTimeout(introTimer);
  }
});
</script>

<style>
.app-root {
  min-height: 100vh;
}
</style>
