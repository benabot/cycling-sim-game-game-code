<template>
  <div class="app-root app-container">
    <!-- Setup Screen -->
    <SetupScreen
      v-if="gameScreen === 'setup'"
      @start="startGame"
      @restore="handleRestore"
    />

    <!-- Game Board -->
    <GameBoard
      v-else-if="gameScreen === 'playing'"
      :key="gameKey"
      :gameConfig="gameConfig"
      :savedState="savedState"
      @backToSetup="backToSetup"
      @restore="handleRestore"
    />

    <IntroSplash v-if="isIntroVisible" @skip="dismissIntroSplash" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { SetupScreen } from './components/index.js';
import GameBoard from './ui/GameBoard.vue';
import IntroSplash from './ui/IntroSplash.vue';

// Screen state: 'setup' | 'playing'
const gameScreen = ref('setup');
const gameConfig = ref(null);
const savedState = ref(null);
const gameKey = ref(0); // Used to force GameBoard re-mount on restore
const isIntroVisible = ref(false);
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

function backToSetup() {
  gameScreen.value = 'setup';
  gameConfig.value = null;
  savedState.value = null;
  dismissIntroSplash();
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
