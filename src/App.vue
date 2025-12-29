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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { SetupScreen } from './components/index.js';
import GameBoard from './ui/GameBoard.vue';

// Screen state: 'setup' | 'playing'
const gameScreen = ref('setup');
const gameConfig = ref(null);

function startGame(config) {
  gameConfig.value = config;
  gameScreen.value = 'playing';
}

function backToSetup() {
  gameScreen.value = 'setup';
  gameConfig.value = null;
}
</script>

<style>
.app-root {
  min-height: 100vh;
}
</style>
