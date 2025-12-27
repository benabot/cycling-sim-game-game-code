<template>
  <div class="setup-screen">
    <div class="setup-container">
      <h1>🚴 Course Cycliste</h1>
      <p class="subtitle">Configuration de la partie</p>

      <!-- Number of teams -->
      <div class="setup-section">
        <h3>Nombre d'équipes</h3>
        <div class="team-count-selector">
          <button 
            v-for="n in [2, 3, 4]" 
            :key="n"
            :class="{ active: numTeams === n }"
            @click="setNumTeams(n)"
          >
            {{ n }} équipes
          </button>
        </div>
      </div>

      <!-- Team configuration -->
      <div class="setup-section">
        <h3>Configuration des joueurs</h3>
        <div class="teams-config">
          <div 
            v-for="(player, index) in players" 
            :key="player.teamId"
            class="team-config-card"
            :style="{ borderColor: player.color }"
          >
            <div class="team-header" :style="{ background: player.bgColor }">
              <span class="team-emoji">{{ player.emoji }}</span>
              <span class="team-name">{{ player.name }}</span>
            </div>
            <div class="team-controls">
              <label class="player-type-toggle">
                <input 
                  type="checkbox" 
                  :checked="player.playerType === 'ai'"
                  @change="togglePlayerType(index)"
                />
                <span class="toggle-label">
                  {{ player.playerType === 'human' ? '👤 Humain' : '🤖 IA' }}
                </span>
              </label>
              <div v-if="player.playerType === 'ai'" class="ai-difficulty">
                <select v-model="player.difficulty" @change="updatePlayer(index)">
                  <option value="easy">Facile</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Course length -->
      <div class="setup-section">
        <h3>Longueur du parcours</h3>
        <div class="course-length-selector">
          <button 
            v-for="len in [60, 80, 100]" 
            :key="len"
            :class="{ active: courseLength === len }"
            @click="courseLength = len"
          >
            {{ len }} cases
            <span class="duration">~{{ Math.round(len / 10) * 3 }} min</span>
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div class="setup-summary">
        <p>
          <strong>{{ humanCount }}</strong> joueur(s) humain(s) 
          vs 
          <strong>{{ aiCount }}</strong> IA
        </p>
      </div>

      <!-- Start button -->
      <button class="btn-start" @click="startGame" :disabled="humanCount === 0">
        🏁 Lancer la course !
      </button>

      <p v-if="humanCount === 0" class="warning">
        ⚠️ Au moins un joueur humain requis
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { 
  TeamId, PlayerType, AIDifficulty, 
  getTeamIds, createPlayerConfig 
} from '../core/teams.js';

const emit = defineEmits(['start']);

// Configuration state
const numTeams = ref(2);
const courseLength = ref(80);
const players = ref([]);

// Initialize players
function initializePlayers() {
  const teamIds = getTeamIds(numTeams.value);
  players.value = teamIds.map((teamId, index) => {
    // First player is human by default
    const isHuman = index === 0;
    return createPlayerConfig(
      teamId,
      isHuman ? PlayerType.HUMAN : PlayerType.AI,
      AIDifficulty.NORMAL
    );
  });
}

// Set number of teams
function setNumTeams(n) {
  numTeams.value = n;
  initializePlayers();
}

// Toggle player type (human/AI)
function togglePlayerType(index) {
  const player = players.value[index];
  const newType = player.playerType === PlayerType.HUMAN ? PlayerType.AI : PlayerType.HUMAN;
  players.value[index] = createPlayerConfig(
    player.teamId,
    newType,
    newType === PlayerType.AI ? AIDifficulty.NORMAL : null
  );
}

// Update player configuration
function updatePlayer(index) {
  // Difficulty already bound via v-model
}

// Computed: count humans and AIs
const humanCount = computed(() => 
  players.value.filter(p => p.playerType === PlayerType.HUMAN).length
);

const aiCount = computed(() => 
  players.value.filter(p => p.playerType === PlayerType.AI).length
);

// Start the game
function startGame() {
  if (humanCount.value === 0) return;
  
  emit('start', {
    numTeams: numTeams.value,
    players: players.value,
    courseLength: courseLength.value
  });
}

// Initialize on mount
initializePlayers();
</script>

<style scoped>
.setup-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.setup-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

h1 {
  text-align: center;
  font-size: 2.5em;
  margin: 0 0 5px 0;
  color: #1e3a5f;
}

.subtitle {
  text-align: center;
  color: #64748b;
  margin: 0 0 30px 0;
}

.setup-section {
  margin-bottom: 30px;
}

.setup-section h3 {
  margin: 0 0 15px 0;
  color: #334155;
  font-size: 1.1em;
}

/* Team count selector */
.team-count-selector {
  display: flex;
  gap: 10px;
}

.team-count-selector button {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s;
}

.team-count-selector button:hover {
  border-color: #3b82f6;
}

.team-count-selector button.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: bold;
}

/* Teams config */
.teams-config {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.team-config-card {
  border: 2px solid;
  border-radius: 12px;
  overflow: hidden;
}

.team-header {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
}

.team-emoji {
  font-size: 1.3em;
}

.team-controls {
  padding: 15px;
  background: #f8fafc;
}

.player-type-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.player-type-toggle input {
  width: 18px;
  height: 18px;
}

.toggle-label {
  font-size: 0.95em;
}

.ai-difficulty {
  margin-top: 10px;
}

.ai-difficulty select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9em;
}

/* Course length */
.course-length-selector {
  display: flex;
  gap: 10px;
}

.course-length-selector button {
  flex: 1;
  padding: 15px 10px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.course-length-selector button:hover {
  border-color: #3b82f6;
}

.course-length-selector button.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.course-length-selector .duration {
  font-size: 0.8em;
  color: #64748b;
  margin-top: 3px;
}

/* Summary */
.setup-summary {
  text-align: center;
  padding: 15px;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 20px;
}

.setup-summary p {
  margin: 0;
  color: #475569;
}

/* Start button */
.btn-start {
  width: 100%;
  padding: 18px;
  font-size: 1.3em;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.btn-start:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.warning {
  text-align: center;
  color: #dc2626;
  margin-top: 10px;
}
</style>
