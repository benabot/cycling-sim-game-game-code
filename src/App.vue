<template>
  <div class="app-root app-container">
    <!-- Setup Screen -->
    <SetupScreen 
      v-if="gameScreen === 'setup'"
      @start="startGame"
    />

    <!-- Game Board -->
    <GameBoard 
      v-else-if="gameScreen === 'playing'"
      :gameConfig="gameConfig"
      @backToSetup="backToSetup"
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
  gameScreen.value = 'playing';
  showIntroSplash();
}

function backToSetup() {
  gameScreen.value = 'setup';
  gameConfig.value = null;
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
