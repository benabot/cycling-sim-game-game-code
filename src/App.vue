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
import { useAuth } from './composables/useAuth.js';
import { useStorage } from './composables/useStorage.js';

const { initSession } = useAuth();
const { loadGame } = useStorage();

onMounted(() => {
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
