<template>
  <div class="game-container">
    <h1>🚴 Course Cycliste - Prototype</h1>
    
    <!-- Game Status -->
    <div class="status-bar" :class="{ 'last-turn': gameStatus.isLastTurn }">
      <span class="turn">Tour {{ gameStatus.turn }}</span>
      <span v-if="gameStatus.isLastTurn" class="last-turn-badge">🏁 DERNIER TOUR</span>
      <span class="phase">{{ phaseLabel }}</span>
      <span v-if="gameStatus.phase === 'finished'" class="winner">
        🏆 Vainqueur: {{ gameStatus.rankings[0]?.name }}
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
              :class="[rider.type, rider.team]"
              :style="{ borderColor: getTeamColor(rider.team) }"
              :title="`${rider.name} (Fatigue: ${rider.fatigue})`"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
        <!-- Finish zone with riders beyond -->
        <div class="finish-zone">
          <span class="finish-flag">🏁</span>
          <div class="finished-riders">
            <span 
              v-for="rider in getFinishedRiders()" 
              :key="rider.id"
              class="rider-token finished"
              :class="[rider.type, rider.team]"
              :style="{ borderColor: getTeamColor(rider.team) }"
              :title="`${rider.name} - Position: ${rider.position + 1}`"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Legend -->
    <div class="team-legend">
      <div class="team-item team_a">
        <span class="team-color" style="background: #dc2626"></span>
        Équipe Rouge
      </div>
      <div class="team-item team_b">
        <span class="team-color" style="background: #2563eb"></span>
        Équipe Bleue
      </div>
    </div>

    <!-- Current Rider Panel -->
    <div 
      v-if="gameStatus.currentRider && gameStatus.phase !== 'finished'" 
      class="current-rider-panel"
      :style="{ borderColor: gameStatus.currentRider.teamConfig?.color }"
    >
      <div class="rider-header" :style="{ background: gameStatus.currentRider.teamConfig?.bgColor }">
        <h2>
          <span class="team-indicator" :style="{ background: gameStatus.currentRider.teamConfig?.color }"></span>
          {{ gameStatus.currentRider.name }}
          <span class="team-name">({{ gameStatus.currentRider.teamConfig?.name }})</span>
        </h2>
      </div>
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

    <!-- Riders Overview by Team -->
    <div class="riders-overview">
      <h3>Classement</h3>
      <div class="teams-container">
        <!-- Team A -->
        <div class="team-column team_a">
          <h4 style="color: #dc2626">🔴 Équipe Rouge</h4>
          <div 
            v-for="rider in getTeamRiders('team_a')" 
            :key="rider.id"
            class="rider-row"
            :class="{ 
              'current': rider.id === gameStatus.currentRider?.id,
              'finished': rider.hasFinished 
            }"
          >
            <span class="emoji">{{ getRiderEmoji(rider.type) }}</span>
            <span class="name">{{ rider.name }}</span>
            <span class="pos">{{ rider.position + 1 }}</span>
            <span class="fatigue">❤️{{ rider.fatigue }}</span>
            <span class="attacks">⚔️{{ rider.attackCardsRemaining }}</span>
            <span v-if="rider.hasFinished" class="finished-badge">🏁</span>
          </div>
        </div>
        <!-- Team B -->
        <div class="team-column team_b">
          <h4 style="color: #2563eb">🔵 Équipe Bleue</h4>
          <div 
            v-for="rider in getTeamRiders('team_b')" 
            :key="rider.id"
            class="rider-row"
            :class="{ 
              'current': rider.id === gameStatus.currentRider?.id,
              'finished': rider.hasFinished 
            }"
          >
            <span class="emoji">{{ getRiderEmoji(rider.type) }}</span>
            <span class="name">{{ rider.name }}</span>
            <span class="pos">{{ rider.position + 1 }}</span>
            <span class="fatigue">❤️{{ rider.fatigue }}</span>
            <span class="attacks">⚔️{{ rider.attackCardsRemaining }}</span>
            <span v-if="rider.hasFinished" class="finished-badge">🏁</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over Panel -->
    <div v-if="gameStatus.phase === 'finished'" class="game-over-panel">
      <h2>🏆 Course Terminée!</h2>
      <div class="final-rankings">
        <div 
          v-for="(rider, index) in gameStatus.rankings.slice(0, 10)" 
          :key="rider.id"
          class="ranking-row"
          :class="rider.team"
        >
          <span class="rank">{{ getMedal(index) }}</span>
          <span class="rider-name">{{ rider.name }}</span>
          <span class="team-badge" :style="{ background: getTeamColor(rider.team) }">
            {{ getTeamShortName(rider.team) }}
          </span>
          <span class="final-pos">Position: {{ rider.position + 1 }}</span>
        </div>
      </div>
      <button @click="restartGame" class="btn restart">
        🔄 Nouvelle partie
      </button>
    </div>

    <!-- Game Log (Console) -->
    <div class="game-log">
      <h3>📜 Historique de la course</h3>
      <div class="log-entries" ref="logContainer">
        <div 
          v-for="(entry, i) in gameLog" 
          :key="i" 
          class="log-entry"
          :class="{ 
            'turn-header': entry.includes('──────'),
            'last-turn-header': entry.includes('DERNIER TOUR'),
            'results-header': entry.includes('RÉSULTATS'),
            'finish': entry.includes('🏁'),
            'attack': entry.includes('⚔️'),
            'fall': entry.includes('💥'),
            'bonus': entry.includes('✨'),
            'penalty': entry.includes('⚠️')
          }"
        >
          {{ entry }}
        </div>
      </div>
    </div>

    <!-- Rules Section -->
    <div class="rules-section">
      <h2>📖 Règles du Jeu</h2>
      
      <div class="rules-grid">
        <div class="rule-card">
          <h3>🎯 Objectif</h3>
          <p>Être le premier à franchir la ligne d'arrivée. Quand un coureur franchit la ligne, le <strong>dernier tour</strong> est déclenché : tous les coureurs jouent une dernière fois, puis le classement final est établi.</p>
        </div>

        <div class="rule-card">
          <h3>🎲 Mouvement</h3>
          <p>Chaque coureur lance <strong>2d6</strong> et avance du total + bonus de terrain. Les bonus dépendent du type de coureur et du terrain.</p>
        </div>

        <div class="rule-card">
          <h3>🚴 Types de Coureurs</h3>
          <ul>
            <li><strong>🧗 Grimpeur:</strong> +2 montagne, +1 côte</li>
            <li><strong>💥 Puncheur:</strong> +2 côte, +1 montagne</li>
            <li><strong>🚴 Rouleur:</strong> +2 plaine, +1 descente</li>
            <li><strong>⚡ Sprinteur:</strong> +3 sprint, +1 plaine/descente</li>
            <li><strong>🎯 Polyvalent:</strong> Aucun bonus/malus</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>🗺️ Terrains</h3>
          <ul>
            <li><span class="terrain-badge flat">🟩 Plaine</span> Favorable aux rouleurs</li>
            <li><span class="terrain-badge hill">🟨 Côte</span> Favorable aux puncheurs</li>
            <li><span class="terrain-badge mountain">🟫 Montagne</span> Favorable aux grimpeurs</li>
            <li><span class="terrain-badge descent">🟦 Descente</span> +3 tous, min 5 cases</li>
            <li><span class="terrain-badge sprint">🟪 Sprint</span> Favorable aux sprinteurs</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>💨 Prise de Vent</h3>
          <p>Un coureur <strong>prend le vent</strong> s'il n'a personne devant lui ou s'il est à 2+ cases du coureur précédent (sauf en montagne et descente). Il pioche alors une <strong>carte Pénalité</strong>.</p>
        </div>

        <div class="rule-card">
          <h3>🎴 Cartes Pénalité</h3>
          <ul>
            <li><strong>Effort soutenu:</strong> +1 fatigue</li>
            <li><strong>Coup de pompe:</strong> +2 fatigue</li>
            <li><strong>Vent de face:</strong> -2 déplacement</li>
            <li><strong>Jambes lourdes:</strong> Mouvement 2-7</li>
            <li><strong>Crevaison:</strong> Pas de mouvement</li>
            <li><strong>Chute isolée:</strong> Recule 2, +2 fatigue</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>✨ Cartes Bonus (sur 7)</h3>
          <p>Quand un coureur fait <strong>exactement 7</strong> aux dés, il pioche une carte Bonus:</p>
          <ul>
            <li><strong>Second souffle:</strong> -1 fatigue</li>
            <li><strong>Aspiration parfaite:</strong> +2 déplacement</li>
            <li><strong>Ravitaillement:</strong> -2 fatigue</li>
            <li><strong>Concentration:</strong> Relancer 1 dé</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>⚔️ Cartes Attaque</h3>
          <p>Chaque coureur a <strong>2 cartes Attaque</strong> par course. Une attaque donne <strong>+3 cases</strong> mais coûte <strong>+1 fatigue</strong>. À utiliser avant de lancer les dés.</p>
        </div>

        <div class="rule-card">
          <h3>❤️ Fatigue</h3>
          <ul>
            <li><strong>0-3:</strong> OK, aucun malus</li>
            <li><strong>4-6:</strong> Fatigué, -1 au déplacement</li>
            <li><strong>7-9:</strong> Épuisé, -2 au déplacement</li>
            <li><strong>10+:</strong> Fringale! Max 4 cases</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>⛰️ Descente</h3>
          <ul>
            <li><strong>Bonus +3</strong> pour tous les coureurs</li>
            <li><strong>Vitesse min 5</strong> cases garanties</li>
            <li><strong>Risque chute</strong> sur double 1 (test 1d6: 1-2 = chute)</li>
            <li><strong>Récupération:</strong> -1 fatigue si dans le peloton</li>
            <li><strong>Pas de prise de vent</strong> en descente</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>🔄 Aspiration</h3>
          <p>En fin de tour, si un coureur est à <strong>1 case</strong> du coureur devant lui, il avance automatiquement d'1 case (regroupement). L'aspiration est <strong>inactive</strong> en montagne et descente.</p>
        </div>

        <div class="rule-card">
          <h3>🏁 Fin de Course</h3>
          <p>Quand le premier coureur franchit la ligne, le <strong>dernier tour</strong> commence. Tous les coureurs (même ceux déjà arrivés) jouent une dernière fois. Le classement est basé sur la position finale.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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
  RiderConfig,
  TeamConfig
} from '../core/game_engine.js';

// Game state
const gameState = ref(null);
const attackUsed = ref(false);
const logContainer = ref(null);

// Initialize game
onMounted(() => {
  initGame();
});

function initGame() {
  gameState.value = createGameState({
    courseLength: 50,
    twoTeams: true
  });
  gameState.value = startTurn(gameState.value);
  attackUsed.value = false;
}

function restartGame() {
  initGame();
}

// Auto-scroll log
watch(() => gameState.value?.gameLog?.length, () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
});

// Computed
const gameStatus = computed(() => {
  if (!gameState.value) return {};
  return getGameStatus(gameState.value);
});

const course = computed(() => gameState.value?.course || []);
const finishLine = computed(() => gameState.value?.finishLine || 50);
const gameLog = computed(() => gameState.value?.gameLog || []);

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

function getFinishedRiders() {
  if (!gameState.value) return [];
  return gameState.value.riders
    .filter(r => r.hasFinished || r.position >= finishLine.value)
    .sort((a, b) => b.position - a.position);
}

function getTeamRiders(team) {
  if (!gameState.value) return [];
  return gameState.value.riders
    .filter(r => r.team === team)
    .sort((a, b) => b.position - a.position);
}

function getRiderEmoji(type) {
  return RiderConfig[type]?.emoji || '🚴';
}

function getTerrainName(terrain) {
  return TerrainConfig[terrain]?.name || terrain;
}

function getTeamColor(team) {
  return TeamConfig[team]?.color || '#666';
}

function getTeamShortName(team) {
  return team === 'team_a' ? 'R' : 'B';
}

function getMedal(index) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}.`;
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
  max-width: 1400px;
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

.status-bar.last-turn {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

.status-bar .turn {
  font-weight: bold;
}

.status-bar .last-turn-badge {
  background: #f59e0b;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.status-bar .winner {
  color: #f59e0b;
  font-weight: bold;
}

/* Board */
.board-container {
  overflow-x: auto;
  margin-bottom: 10px;
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
  border: 2px solid;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.rider-token.team_a { border-color: #dc2626; background: #fecaca; }
.rider-token.team_b { border-color: #2563eb; background: #bfdbfe; }

.finish-zone {
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 10px;
  background: #1a1a1a;
  border-radius: 0 8px 8px 0;
}

.finish-flag {
  font-size: 24px;
}

.finished-riders {
  display: flex;
  gap: 4px;
}

/* Team Legend */
.team-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
  font-size: 14px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

/* Current Rider Panel */
.current-rider-panel {
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 3px solid;
  overflow: hidden;
}

.rider-header {
  padding: 10px 20px;
  display: flex;
  align-items: center;
}

.rider-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.team-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.team-name {
  font-size: 14px;
  font-weight: normal;
  color: #666;
}

.rider-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px 20px;
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
  padding: 15px 20px;
  background: #fff;
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

.btn.attack { background: #f59e0b; color: white; }
.btn.roll { background: #3b82f6; color: white; }
.btn.resolve { background: #22c55e; color: white; }
.btn.select { background: #8b5cf6; color: white; }
.btn.restart { background: #6366f1; color: white; font-size: 16px; padding: 15px 30px; }

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

.card-drawn .penalty { color: #dc2626; }
.card-drawn .bonus { color: #16a34a; }

/* Riders Overview */
.riders-overview {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.riders-overview h3 {
  margin: 0 0 10px 0;
  text-align: center;
}

.teams-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.team-column h4 {
  margin: 0 0 10px 0;
}

.rider-row {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 5px;
  background: #fff;
  align-items: center;
  font-size: 13px;
}

.team_a .rider-row { border-left: 3px solid #dc2626; }
.team_b .rider-row { border-left: 3px solid #2563eb; }

.rider-row.current {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.rider-row.finished {
  background: #dcfce7;
}

.rider-row .name {
  font-weight: 500;
  flex: 1;
}

.rider-row .pos,
.rider-row .fatigue,
.rider-row .attacks {
  font-size: 11px;
  color: #666;
}

.finished-badge {
  margin-left: auto;
}

/* Game Over Panel */
.game-over-panel {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
  border: 3px solid #f59e0b;
}

.game-over-panel h2 {
  margin: 0 0 20px 0;
}

.final-rankings {
  max-width: 500px;
  margin: 0 auto 20px;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  margin-bottom: 5px;
}

.ranking-row.team_a { border-left: 4px solid #dc2626; }
.ranking-row.team_b { border-left: 4px solid #2563eb; }

.ranking-row .rank {
  font-size: 20px;
  width: 40px;
}

.ranking-row .rider-name {
  flex: 1;
  font-weight: 500;
}

.ranking-row .team-badge {
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* Game Log */
.game-log {
  background: #1f2937;
  color: #e5e7eb;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.game-log h3 {
  margin: 0 0 10px 0;
  color: #fff;
}

.log-entries {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.log-entry {
  padding: 4px 8px;
  border-radius: 2px;
}

.log-entry.turn-header {
  color: #9ca3af;
  margin-top: 8px;
  font-weight: bold;
}

.log-entry.last-turn-header {
  color: #fbbf24;
  background: #422006;
  margin-top: 8px;
  font-weight: bold;
}

.log-entry.results-header {
  color: #fbbf24;
  background: #422006;
  margin-top: 8px;
  font-weight: bold;
}

.log-entry.finish { color: #34d399; }
.log-entry.attack { color: #f59e0b; }
.log-entry.fall { color: #ef4444; }
.log-entry.bonus { color: #a78bfa; }
.log-entry.penalty { color: #fb923c; }

/* Rules Section */
.rules-section {
  background: #f8fafc;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.rules-section h2 {
  text-align: center;
  margin: 0 0 25px 0;
  color: #1e293b;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.rule-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.rule-card h3 {
  margin: 0 0 10px 0;
  color: #334155;
  font-size: 16px;
}

.rule-card p {
  margin: 0 0 10px 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.rule-card ul {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
  font-size: 13px;
}

.rule-card li {
  margin-bottom: 5px;
}

.terrain-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 5px;
}

.terrain-badge.flat { background: #90EE90; }
.terrain-badge.hill { background: #FFD700; }
.terrain-badge.mountain { background: #CD853F; color: white; }
.terrain-badge.descent { background: #87CEEB; }
.terrain-badge.sprint { background: #FF69B4; color: white; }
</style>
