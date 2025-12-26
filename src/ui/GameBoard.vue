<template>
  <div class="game-container">
    <h1>🚴 Course Cycliste - Prototype</h1>
    
    <!-- Game Status -->
    <div class="status-bar">
      <span class="turn">Tour {{ gameStatus.turn }}</span>
      <span class="phase">{{ phaseLabel }}</span>
      <span v-if="gameStatus.winner" class="winner">
        🏆 Vainqueur: {{ gameStatus.winner.name }}
      </span>
    </div>

    <!-- Course Board -->
    <div class="board-container">
      <div class="course">
        <div 
          v-for="(cell, index) in course" 
          :key="index"
          class="cell"
          :class="[cell.terrain, { 'finish': index === finishLine - 1 }]"
          :title="`Case ${index + 1} - ${getTerrainName(cell.terrain)}`"
        >
          <span class="cell-number">{{ index + 1 }}</span>
          <div class="riders-on-cell">
            <span 
              v-for="rider in getRidersAtPosition(index)" 
              :key="rider.id"
              class="rider-token"
              :class="rider.type"
              :title="`${rider.name} (Fatigue: ${rider.fatigue})`"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
        <!-- Finish zone -->
        <div class="finish-zone">
          <span>🏁</span>
        </div>
      </div>
    </div>

    <!-- Current Rider Panel -->
    <div v-if="gameStatus.currentRider && !gameStatus.winner" class="current-rider-panel">
      <h2>{{ gameStatus.currentRider.name }}</h2>
      <div class="rider-info">
        <span class="rider-type">{{ getRiderEmoji(gameStatus.currentRider.type) }} {{ gameStatus.currentRider.config.name }}</span>
        <span class="terrain">📍 {{ gameStatus.currentRider.terrainConfig.name }}</span>
        <span class="fatigue" :class="fatigueClass">
          ❤️ Fatigue: {{ gameStatus.currentRider.fatigue }}/10 
          ({{ gameStatus.currentRider.fatigueStatus.status }})
        </span>
        <span class="attacks">⚔️ Attaques: {{ gameStatus.currentRider.attackCardsRemaining }}</span>
        <span class="position">📊 Position: {{ gameStatus.currentRider.position + 1 }}</span>
      </div>

      <!-- Actions -->
      <div class="actions">
        <!-- Pre-roll phase -->
        <template v-if="gameStatus.turnPhase === 'pre_roll'">
          <button 
            v-if="gameStatus.canAttack"
            @click="useAttack"
            class="btn attack"
            :disabled="attackUsed"
          >
            ⚔️ Attaque (+3) {{ attackUsed ? '✓' : '' }}
          </button>
          <button @click="rollDice" class="btn roll">
            🎲 Lancer les dés
          </button>
        </template>

        <!-- Resolve phase -->
        <template v-if="gameStatus.turnPhase === 'resolve'">
          <div class="dice-result">
            <span class="dice">🎲 {{ gameStatus.lastDiceRoll?.dice1 }} + {{ gameStatus.lastDiceRoll?.dice2 }} = {{ gameStatus.lastDiceRoll?.total }}</span>
            <span class="movement">→ Déplacement: {{ calculatedMovement }} cases</span>
          </div>
          <div v-if="gameStatus.lastCard" class="card-drawn">
            <span :class="gameStatus.lastCard.type">
              {{ gameStatus.lastCard.type === 'penalty' ? '❌' : '✅' }}
              {{ gameStatus.lastCard.card.name }}
            </span>
          </div>
          <button @click="resolveMove" class="btn resolve">
            ✓ Appliquer le mouvement
          </button>
        </template>

        <!-- Select rider phase -->
        <template v-if="gameStatus.turnPhase === 'select_rider'">
          <button @click="selectCurrentRider" class="btn select">
            ▶️ Jouer {{ gameStatus.currentRider?.name }}
          </button>
        </template>
      </div>
    </div>

    <!-- Riders Overview -->
    <div class="riders-overview">
      <h3>Classement</h3>
      <div 
        v-for="rider in sortedRiders" 
        :key="rider.id"
        class="rider-row"
        :class="{ 
          'current': rider.id === gameStatus.currentRider?.id,
          'finished': rider.hasFinished 
        }"
      >
        <span class="emoji">{{ getRiderEmoji(rider.type) }}</span>
        <span class="name">{{ rider.name }}</span>
        <span class="pos">Pos: {{ rider.position + 1 }}</span>
        <span class="fatigue">❤️ {{ rider.fatigue }}</span>
        <span class="attacks">⚔️ {{ rider.attackCardsRemaining }}</span>
        <span v-if="rider.hasFinished" class="finished-badge">🏁</span>
      </div>
    </div>

    <!-- Turn Log -->
    <div class="turn-log">
      <h3>Journal</h3>
      <div class="log-entries">
        <div v-for="(entry, i) in turnLog" :key="i" class="log-entry">
          {{ entry }}
        </div>
      </div>
    </div>

    <!-- Restart button -->
    <div v-if="gameStatus.winner" class="game-over">
      <button @click="restartGame" class="btn restart">
        🔄 Nouvelle partie
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  createGameState,
  startTurn,
  selectRider,
  playAttackCard,
  rollDice as rollDiceAction,
  resolveMovement,
  calculateMovement,
  getGameStatus,
  TerrainConfig,
  RiderConfig
} from '../core/game_engine.js';

// Game state
const gameState = ref(null);
const attackUsed = ref(false);

// Initialize game
onMounted(() => {
  initGame();
});

function initGame() {
  gameState.value = createGameState({
    courseLength: 50,
    riderCount: 5
  });
  gameState.value = startTurn(gameState.value);
  attackUsed.value = false;
}

function restartGame() {
  initGame();
}

// Computed
const gameStatus = computed(() => {
  if (!gameState.value) return {};
  return getGameStatus(gameState.value);
});

const course = computed(() => gameState.value?.course || []);
const finishLine = computed(() => gameState.value?.finishLine || 50);
const turnLog = computed(() => gameState.value?.turnLog || []);

const sortedRiders = computed(() => {
  if (!gameState.value) return [];
  return [...gameState.value.riders].sort((a, b) => b.position - a.position);
});

const calculatedMovement = computed(() => {
  if (!gameState.value) return 0;
  return calculateMovement(gameState.value);
});

const phaseLabel = computed(() => {
  const labels = {
    'select_rider': 'Sélection',
    'pre_roll': 'Préparation',
    'roll_dice': 'Lancer',
    'resolve': 'Résolution'
  };
  return labels[gameStatus.value.turnPhase] || '';
});

const fatigueClass = computed(() => {
  const status = gameStatus.value.currentRider?.fatigueStatus?.status;
  return {
    'ok': status === 'OK',
    'tired': status === 'Fatigué',
    'exhausted': status === 'Épuisé',
    'fringale': status === 'Fringale'
  };
});

// Methods
function getRidersAtPosition(position) {
  if (!gameState.value) return [];
  return gameState.value.riders.filter(r => r.position === position && !r.hasFinished);
}

function getRiderEmoji(type) {
  return RiderConfig[type]?.emoji || '🚴';
}

function getTerrainName(terrain) {
  return TerrainConfig[terrain]?.name || terrain;
}

function selectCurrentRider() {
  gameState.value = selectRider(gameState.value);
}

function useAttack() {
  gameState.value = playAttackCard(gameState.value);
  attackUsed.value = true;
}

function rollDice() {
  gameState.value = rollDiceAction(gameState.value);
}

function resolveMove() {
  gameState.value = resolveMovement(gameState.value);
  attackUsed.value = false;
}
</script>

<style scoped>
.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-bar .turn {
  font-weight: bold;
}

.status-bar .winner {
  color: #f59e0b;
  font-weight: bold;
}

/* Board */
.board-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.course {
  display: flex;
  gap: 2px;
  padding: 10px;
  background: #333;
  border-radius: 8px;
  min-width: max-content;
}

.cell {
  width: 40px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  border-radius: 4px;
  font-size: 10px;
}

.cell.flat { background: #90EE90; }
.cell.hill { background: #FFD700; }
.cell.mountain { background: #CD853F; }
.cell.descent { background: #87CEEB; }
.cell.sprint { background: #FF69B4; }
.cell.finish { border: 2px solid #000; }

.cell-number {
  font-size: 8px;
  color: #666;
}

.riders-on-cell {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1px;
}

.rider-token {
  font-size: 14px;
  cursor: pointer;
}

.finish-zone {
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 24px;
}

/* Current Rider Panel */
.current-rider-panel {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.current-rider-panel h2 {
  margin: 0 0 15px 0;
}

.rider-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.rider-info span {
  padding: 5px 10px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.fatigue.ok { border-color: #22c55e; }
.fatigue.tired { border-color: #f59e0b; }
.fatigue.exhausted { border-color: #ef4444; }
.fatigue.fringale { border-color: #7f1d1d; background: #fecaca; }

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.attack {
  background: #f59e0b;
  color: white;
}

.btn.roll {
  background: #3b82f6;
  color: white;
}

.btn.resolve {
  background: #22c55e;
  color: white;
}

.btn.select {
  background: #8b5cf6;
  color: white;
}

.btn.restart {
  background: #6366f1;
  color: white;
  font-size: 16px;
  padding: 15px 30px;
}

.dice-result {
  display: flex;
  gap: 15px;
  font-size: 18px;
  font-weight: bold;
}

.card-drawn {
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 500;
}

.card-drawn .penalty {
  color: #dc2626;
}

.card-drawn .bonus {
  color: #16a34a;
}

/* Riders Overview */
.riders-overview {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.riders-overview h3 {
  margin: 0 0 10px 0;
}

.rider-row {
  display: flex;
  gap: 15px;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 5px;
  background: #fff;
  align-items: center;
}

.rider-row.current {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.rider-row.finished {
  background: #dcfce7;
}

.rider-row .name {
  font-weight: 500;
  min-width: 100px;
}

.rider-row .pos,
.rider-row .fatigue,
.rider-row .attacks {
  font-size: 12px;
  color: #666;
}

.finished-badge {
  margin-left: auto;
}

/* Turn Log */
.turn-log {
  background: #1f2937;
  color: #e5e7eb;
  padding: 15px;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.turn-log h3 {
  margin: 0 0 10px 0;
  color: #fff;
}

.log-entry {
  padding: 4px 0;
  font-size: 13px;
  font-family: monospace;
  border-bottom: 1px solid #374151;
}

.log-entry:last-child {
  border-bottom: none;
}

/* Game Over */
.game-over {
  text-align: center;
  padding: 20px;
}
</style>
