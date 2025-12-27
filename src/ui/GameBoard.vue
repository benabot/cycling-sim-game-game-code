<template>
  <div class="game-container">
    <div class="header-row">
      <h1>🚴 Course Cycliste - v4.0</h1>
      <button v-if="phase === 'finished'" class="btn-back" @click="$emit('backToSetup')">
        ← Nouvelle partie
      </button>
    </div>
    
    <!-- AI Thinking Indicator -->
    <div v-if="isAIThinking" class="ai-thinking">
      🤖 L'IA réfléchit...
    </div>
    
    <!-- Status Bar -->
    <GameStatusBar 
      :turn="turn"
      :phase="phase"
      :turnPhase="turnPhase"
      :currentTeam="currentTeam"
      :isLastTurn="isLastTurn"
      :winningTeam="winningTeam"
    />

    <!-- Terrain Legend -->
    <TerrainLegend />

    <!-- Course Board -->
    <CourseBoard 
      :course="course"
      :riders="allRiders"
      :selectedRiderId="selectedRiderId"
      :animatingRiders="animatingRiders"
      :aspirationAnimations="aspirationAnimations"
      :getLeaderAtPosition="getLeaderAt"
      :previewPositions="previewPositions"
    />

    <!-- Effects Overlay -->
    <EffectsOverlay 
      v-if="showEffectsOverlay"
      :turn="turn"
      :effects="endTurnEffects"
      @acknowledge="acknowledgeEffects"
    />

    <!-- Selected Rider Panel -->
    <template v-if="currentRider && phase !== 'finished' && !showEffectsOverlay">
      <RiderPanel
        :rider="currentRider"
        :terrain="currentRider.terrain"
        :terrainBonus="currentRider.terrainBonus"
        :canUseSpecialty="currentRider.availableCards?.canUseSpecialty"
        :turnPhase="turnPhase"
        :selectedCardId="selectedCardId"
        @cancel="cancelRiderSelection"
        @selectCard="selectCard"
      >
        <template #actions>
          <ActionZone 
            :turnPhase="turnPhase"
            :cardValue="getSelectedCardValue()"
            :isAttackCard="isSelectedCardAttack()"
            :diceResult="lastDiceRoll?.result || 0"
            :terrainBonus="currentRider.terrainBonus"
            :hasSpecialtyCards="currentRider.specialtyCards?.length > 0"
            :useSpecialty="!!selectedSpecialtyId"
            :totalMovement="calculatedMovement"
            :currentPosition="currentRider.position"
            @rollDice="rollDice"
            @cancelCard="cancelCardSelection"
            @useSpecialty="useSpecialty"
            @skipSpecialty="skipSpecialty"
            @resolve="resolve"
          />
        </template>
      </RiderPanel>
    </template>

    <!-- No Selection Prompt -->
    <div v-else-if="phase !== 'finished' && !showEffectsOverlay" class="no-selection-prompt">
      <span class="prompt-icon">👆</span>
      <span>Cliquez sur un coureur de <strong>{{ currentTeamConfig?.name }}</strong> pour le jouer</span>
    </div>

    <!-- Team Legend (dynamique) -->
    <div class="team-legend" v-if="!showEffectsOverlay">
      <div 
        v-for="teamId in teamIds" 
        :key="teamId"
        class="team-item"
      >
        <span class="team-color" :style="{ background: getTeamColor(teamId) }"></span>
        {{ getTeamName(teamId) }}
        <span v-if="isTeamAI(teamId)">🤖</span>
      </div>
    </div>

    <!-- Teams Overview -->
    <TeamsOverview 
      v-if="phase !== 'finished' && !showEffectsOverlay"
      :riders="allRiders"
      :currentTeam="currentTeam"
      :selectedRiderId="selectedRiderId"
      :playedRiders="playedThisTurn"
      :teamIds="teamIds"
      :players="players"
      @selectRider="selectRider"
    />

    <!-- Game Over -->
    <GameOverPanel 
      v-if="phase === 'finished'"
      :winningTeam="winningTeam"
      :rankings="rankings"
      @restart="restartGame"
    />

    <!-- Game Log -->
    <GameLog :log="gameLog" />

    <!-- Rules Section -->
    <RulesSection />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useGameEngine } from '../composables/useGameEngine.js';
import { TeamConfigs, PlayerType } from '../core/teams.js';
import {
  GameStatusBar,
  TerrainLegend,
  CourseBoard,
  EffectsOverlay,
  RiderPanel,
  ActionZone,
  TeamsOverview,
  GameOverPanel,
  GameLog,
  RulesSection
} from '../components';

// Props and emits
const props = defineProps({
  gameConfig: { type: Object, default: null }
});

defineEmits(['backToSetup']);

// Initialize game engine
const {
  // State
  gameLog,
  turnPhase,
  selectedRiderId,
  selectedCardId,
  selectedSpecialtyId,
  lastDiceRoll,
  calculatedMovement,
  playedThisTurn,
  animatingRiders,
  aspirationAnimations,
  showEffectsOverlay,
  endTurnEffects,
  isAIThinking,
  
  // Computed
  course,
  allRiders,
  currentTeam,
  turn,
  phase,
  isLastTurn,
  winningTeam,
  rankings,
  currentTeamConfig,
  currentRider,
  previewPositions,
  isAITurn,
  numTeams,
  teamIds,
  players,
  
  // Actions
  initialize,
  selectRider,
  cancelRiderSelection,
  selectCard,
  cancelCardSelection,
  rollDice,
  useSpecialty,
  skipSpecialty,
  resolve,
  acknowledgeEffects,
  restartGame,
  executeAITurn,
  
  // Utils
  getLeaderAt,
  getSelectedCard
} = useGameEngine();

// Card helpers
function getSelectedCardValue() {
  const card = getSelectedCard();
  return card?.value || 0;
}

function isSelectedCardAttack() {
  if (!currentRider.value) return false;
  return currentRider.value.attackCards?.some(c => c.id === selectedCardId.value);
}

// Team helpers for dynamic legend
function getTeamColor(teamId) {
  return TeamConfigs[teamId]?.color || '#666';
}

function getTeamName(teamId) {
  return TeamConfigs[teamId]?.name || teamId;
}

function isTeamAI(teamId) {
  const player = players.value?.find(p => p.teamId === teamId);
  return player?.playerType === PlayerType.AI;
}

// Initialize on mount with game config
onMounted(() => {
  initialize(props.gameConfig);
});

// v4.0: Watch for AI turns and execute automatically
watch(
  [isAITurn, turnPhase, showEffectsOverlay, phase],
  ([aiTurn, tPhase, effectsShowing, gamePhase]) => {
    // Only execute AI if:
    // - It's an AI turn
    // - Game is still playing
    // - Not showing effects overlay
    // - Valid turn phase
    if (aiTurn && gamePhase !== 'finished' && !effectsShowing) {
      const validPhases = ['select_rider', 'select_card', 'roll_dice', 'select_specialty', 'resolve'];
      if (validPhases.includes(tPhase)) {
        // Small delay before AI action for visibility
        setTimeout(() => executeAITurn(), 200);
      }
    }
  },
  { immediate: true }
);
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
}

.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #1e293b;
}

.no-selection-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;
  color: #64748b;
  font-size: 1.1em;
}

.team-legend {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 15px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

/* v4.0: Header and AI styles */
.header-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.header-row h1 {
  margin: 0;
}

.btn-back {
  padding: 8px 16px;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-back:hover {
  background: #475569;
}

.ai-thinking {
  text-align: center;
  padding: 10px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 15px;
  color: #92400e;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
